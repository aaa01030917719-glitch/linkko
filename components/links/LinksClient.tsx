"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import LinkListItem from "@/components/link/LinkListItem";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FavoriteStarButton from "@/components/ui/FavoriteStarButton";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { recordRecentFolder, recordRecentLink } from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import {
  extractDomain,
  getLinkTargetValue,
  LINK_OPEN_ERROR_MESSAGE,
  openLinkTarget,
} from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

interface SaveOptions {
  folderName?: string | null;
  source: "external-share" | "in-app";
}

type FolderSheetMode = "actions" | "rename";

const FILTER_ALL = "__all__";
const FILTER_FAVORITES = "__favorites__";
const UNCATEGORIZED_FOLDER_ID = "__uncategorized__";
const EXPANDED_FOLDER_IDS_STORAGE_KEY = "linkko:links:expanded-folder-ids";
const WIDGET_RECENT_LINKS_MESSAGE_TYPE = "LINKKO_WIDGET_RECENT_LINKS";

interface LinkFolderGroup {
  id: string;
  name: string;
  folder: Folder | null;
  links: LinkType[];
}

function getSaveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더에 저장했어요` : "링크를 저장했어요";
}

function sortLinksByFavoriteAndRecency(sourceLinks: LinkType[], favoriteIds: Set<string>) {
  return [...sourceLinks].sort((left, right) => {
    const favoriteDiff =
      Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id));

    if (favoriteDiff !== 0) {
      return favoriteDiff;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

function sortFoldersByFavoriteAndOrder(sourceFolders: Folder[], favoriteIds: Set<string>) {
  return [...sourceFolders].sort((left, right) => {
    const favoriteDiff =
      Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id));

    if (favoriteDiff !== 0) {
      return favoriteDiff;
    }

    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }

    return left.name.localeCompare(right.name, "ko");
  });
}

function sortLinksByCreatedAtDesc(sourceLinks: LinkType[]) {
  return [...sourceLinks].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function getWidgetLinkTitle(link: LinkType) {
  const url = getLinkTargetValue(link);
  const domain = url ? extractDomain(url) : link.preview_site_name?.trim() || "링크";

  return link.custom_title?.trim() || link.preview_title?.trim() || domain || "링크";
}

function postRecentLinksToNativeWidget(sourceLinks: LinkType[]) {
  if (
    typeof window === "undefined" ||
    typeof window.ReactNativeWebView?.postMessage !== "function"
  ) {
    return;
  }

  const links = sortLinksByCreatedAtDesc(sourceLinks)
    .slice(0, 24)
    .map((link) => ({
      id: link.id,
      title: getWidgetLinkTitle(link),
      url: getLinkTargetValue(link),
    }));

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: WIDGET_RECENT_LINKS_MESSAGE_TYPE,
      links,
    }),
  );
}

export default function LinksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder") ?? searchParams.get("folderId");
  const filterParam = searchParams.get("filter");
  const sourceParam = searchParams.get("source");
  const querySharedText = searchParams.get("sharedText");
  const querySharedUrl = searchParams.get("sharedUrl");
  const isFavoritesFilter = filterParam === "favorites";
  const isExternalShareEntry = sourceParam === "external-share";
  const shouldOpenAddFromQuery = searchParams.get("openAdd") === "1";
  const shouldRefreshWidgetFromQuery = searchParams.get("widgetRefresh") === "1";

  const renameInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const [folderSheetMode, setFolderSheetMode] = useState<FolderSheetMode>("actions");
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
  const [expandedStateLoaded, setExpandedStateLoaded] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [folderActionLoading, setFolderActionLoading] = useState(false);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<Folder | null>(null);
  const { toast, showToast } = useToast();
  const {
    favoriteIds: favoriteLinkIds,
    toggleFavorite: toggleFavoriteLink,
  } = useFavoriteIds("links", user?.id ?? null);
  const {
    favoriteIds: favoriteFolderIds,
    toggleFavorite: toggleFavoriteFolder,
  } = useFavoriteIds("folders", user?.id ?? null);
  const { clearPendingSharedLink, sharedText, sharedUrl } = usePendingSharedLink({
    text: querySharedText,
    url: querySharedUrl,
  });

  const {
    folders,
    error: foldersError,
    createFolder,
    deleteFolder,
    pinFolder,
    renameFolder,
    refetch: refetchFolders,
  } = useFolders();

  const currentFolder = useMemo(
    () => (folderParam ? folders.find((folder) => folder.id === folderParam) ?? null : null),
    [folderParam, folders],
  );

  const {
    links,
    loading,
    error: linksError,
    addLink,
    refetch: refetchLinks,
  } = useLinks();

  const sortedFolders = useMemo(
    () => sortFoldersByFavoriteAndOrder(folders, favoriteFolderIds),
    [favoriteFolderIds, folders],
  );

  const sortedLinks = useMemo(
    () => sortLinksByFavoriteAndRecency(links, favoriteLinkIds),
    [favoriteLinkIds, links],
  );

  const visibleLinks = useMemo(() => {
    if (isFavoritesFilter) {
      return sortedLinks.filter((link) => favoriteLinkIds.has(link.id));
    }

    return sortedLinks;
  }, [favoriteLinkIds, isFavoritesFilter, sortedLinks]);

  const currentFilterValue =
    currentFolder?.id ?? (isFavoritesFilter ? FILTER_FAVORITES : FILTER_ALL);

  const linkGroups = useMemo<LinkFolderGroup[]>(() => {
    const linksByFolderId = new Map<string, LinkType[]>();

    visibleLinks.forEach((link) => {
      const groupId = link.folder_id ?? UNCATEGORIZED_FOLDER_ID;
      const groupLinks = linksByFolderId.get(groupId) ?? [];
      groupLinks.push(link);
      linksByFolderId.set(groupId, groupLinks);
    });

    const folderGroups = sortedFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      folder,
      links: linksByFolderId.get(folder.id) ?? [],
    }));

    const uncategorizedLinks = linksByFolderId.get(UNCATEGORIZED_FOLDER_ID) ?? [];

    if (uncategorizedLinks.length === 0) {
      return folderGroups;
    }

    return [
      ...folderGroups,
      {
        id: UNCATEGORIZED_FOLDER_ID,
        name: "폴더 없음",
        folder: null,
        links: uncategorizedLinks,
      },
    ];
  }, [sortedFolders, visibleLinks]);

  const allFolderGroupIds = useMemo(
    () => linkGroups.map((group) => group.id),
    [linkGroups],
  );

  const allFoldersExpanded =
    allFolderGroupIds.length > 0 && allFolderGroupIds.every((id) => expandedFolderIds.has(id));

  const clearOpenAddQuery = useCallback(() => {
    if (!searchParams.has("openAdd")) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("openAdd");

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/links?${nextQuery}` : "/links", { scroll: false });
  }, [router, searchParams]);

  const clearWidgetRefreshQuery = useCallback(() => {
    if (!searchParams.has("widgetRefresh")) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("widgetRefresh");

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/links?${nextQuery}` : "/links", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  useEffect(() => {
    if (!shouldOpenAddFromQuery) {
      return;
    }

    setAddOpen(true);
    clearOpenAddQuery();
  }, [clearOpenAddQuery, shouldOpenAddFromQuery]);

  useEffect(() => {
    if (folderParam && folders.length > 0 && !currentFolder) {
      router.replace("/links", { scroll: false });
    }
  }, [currentFolder, folderParam, folders.length, router]);

  useEffect(() => {
    if (!shouldRefreshWidgetFromQuery) {
      return;
    }

    const refreshWidgetLinks = async () => {
      await refetchLinks();
      clearWidgetRefreshQuery();
    };

    void refreshWidgetLinks();
  }, [clearWidgetRefreshQuery, refetchLinks, shouldRefreshWidgetFromQuery]);

  useEffect(() => {
    if (loading) {
      return;
    }

    postRecentLinksToNativeWidget(links);
  }, [links, loading]);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(EXPANDED_FOLDER_IDS_STORAGE_KEY);
      const storedIds = storedValue ? JSON.parse(storedValue) : [];

      if (Array.isArray(storedIds)) {
        setExpandedFolderIds(new Set(storedIds.filter((id) => typeof id === "string")));
      }
    } catch {
      setExpandedFolderIds(new Set());
    } finally {
      setExpandedStateLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!expandedStateLoaded || !folderParam || !currentFolder) {
      return;
    }

    setExpandedFolderIds((previousIds) => {
      if (previousIds.has(currentFolder.id)) {
        return previousIds;
      }

      const nextIds = new Set(previousIds);
      nextIds.add(currentFolder.id);
      window.localStorage.setItem(
        EXPANDED_FOLDER_IDS_STORAGE_KEY,
        JSON.stringify(Array.from(nextIds)),
      );
      return nextIds;
    });
  }, [currentFolder, expandedStateLoaded, folderParam]);

  useEffect(() => {
    if (!folderSheetOpen || folderSheetMode !== "rename") {
      return;
    }

    const timer = window.setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [folderSheetMode, folderSheetOpen]);

  useEffect(() => {
    if (!folderSheetOpen || !activeFolder) {
      return;
    }

    setRenameValue(activeFolder.name);
  }, [activeFolder, folderSheetOpen]);

  useEffect(() => {
    if (!currentFolder) {
      return;
    }

    recordRecentFolder(user?.id ?? null, {
      id: currentFolder.id,
      name: currentFolder.name,
    });
  }, [currentFolder, user?.id]);

  function buildLinksPath(nextValue?: string) {
    const nextSearchParams = new URLSearchParams();

    if (nextValue === FILTER_FAVORITES) {
      nextSearchParams.set("filter", "favorites");
    } else if (nextValue && nextValue !== FILTER_ALL) {
      nextSearchParams.set("folder", nextValue);
    }

    const nextQuery = nextSearchParams.toString();
    return nextQuery ? `/links?${nextQuery}` : "/links";
  }

  function replaceFilter(nextValue: string) {
    router.replace(buildLinksPath(nextValue), { scroll: false });
  }

  function clearPendingSharedState() {
    clearPendingSharedLink();
  }

  function clearSharedQuery() {
    if (
      !searchParams.has("shared") &&
      !searchParams.has("sharedText") &&
      !searchParams.has("sharedUrl") &&
      !searchParams.has("t") &&
      !searchParams.has("source")
    ) {
      return;
    }

    router.replace(buildLinksPath(currentFilterValue), { scroll: false });
  }

  function clearSharedEntry() {
    clearPendingSharedState();
    clearSharedQuery();
  }

  async function handleAdd(payload: Partial<LinkType>, options?: SaveOptions) {
    try {
      const savedLink = await addLink(payload);
      setAddOpen(false);
      clearPendingSharedState();

      if (!savedLink?.id) {
        clearSharedQuery();
        return { savedLinkId: null };
      }

      if (options?.source === "external-share") {
        router.replace(`/links/${savedLink.id}`, {
          scroll: false,
        });
        return { savedLinkId: savedLink.id };
      }

      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast(getSaveSuccessMessage(options?.folderName));
      router.push(`/links/${savedLink.id}`);
      return { savedLinkId: savedLink.id };
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleRenameCurrentFolder() {
    if (!activeFolder) {
      return;
    }

    const trimmedName = renameValue.trim();

    if (!trimmedName) {
      setRenameError("폴더 이름을 입력해 주세요.");
      return;
    }

    setFolderActionLoading(true);
    setRenameError("");

    try {
      await renameFolder(activeFolder.id, trimmedName);
      await refetchFolders();
      setFolderSheetOpen(false);
      setFolderSheetMode("actions");
      showToast("폴더 이름을 바꿨어요.");
    } catch {
      setRenameError("이름을 바꾸지 못했어요. 다시 시도해 주세요.");
    } finally {
      setFolderActionLoading(false);
    }
  }

  async function handlePinCurrentFolder() {
    if (!activeFolder) {
      return;
    }

    setFolderActionLoading(true);

    try {
      await pinFolder(activeFolder.id);
      await refetchFolders();
      setFolderSheetOpen(false);
      showToast("폴더를 상단에 고정했어요.");
    } catch {
      showToast("폴더를 고정하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setFolderActionLoading(false);
    }
  }

  async function handleDeleteCurrentFolder() {
    if (!pendingDeleteFolder) {
      return;
    }

    setFolderActionLoading(true);

    try {
      await deleteFolder(pendingDeleteFolder.id);
      setPendingDeleteFolder(null);
      setFolderSheetOpen(false);
      setFolderSheetMode("actions");
      setActiveFolder(null);
      if (folderParam === pendingDeleteFolder.id) {
        router.replace("/links");
      }
      await Promise.all([refetchFolders(), refetchLinks()]);
      showToast("폴더를 삭제했어요.");
    } catch {
      showToast("폴더를 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setFolderActionLoading(false);
    }
  }

  function handleOpenAddLink() {
    clearSharedEntry();
    setAddOpen(true);
  }

  function handleCloseAddLink() {
    clearOpenAddQuery();
    clearSharedEntry();
    setAddOpen(false);
  }

  function handleOpenLink(link: LinkType) {
    recordRecentLink(user?.id ?? null, link);
    const openResult = openLinkTarget(link);

    if (openResult === "invalid") {
      showToast(LINK_OPEN_ERROR_MESSAGE);
    }
  }

  function updateExpandedFolderIds(nextIds: Set<string>) {
    setExpandedFolderIds(nextIds);
    window.localStorage.setItem(
      EXPANDED_FOLDER_IDS_STORAGE_KEY,
      JSON.stringify(Array.from(nextIds)),
    );
  }

  function toggleFolderExpanded(folderId: string) {
    const nextIds = new Set(expandedFolderIds);

    if (nextIds.has(folderId)) {
      nextIds.delete(folderId);
    } else {
      nextIds.add(folderId);
    }

    updateExpandedFolderIds(nextIds);
  }

  function toggleAllFoldersExpanded(checked: boolean) {
    updateExpandedFolderIds(checked ? new Set(allFolderGroupIds) : new Set());
  }

  function openFolderActions(folder: Folder) {
    setActiveFolder(folder);
    setFolderSheetOpen(true);
    setFolderSheetMode("actions");
    setRenameValue(folder.name);
    setRenameError("");
  }

  return (
    <>
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <header className="space-y-2 px-5 pt-5 pb-1">
          <h2 className="text-2xl font-bold text-gray-900">저장한 링크</h2>
          <p className="text-sm text-gray-500">필요할 때 다시 열어보세요</p>
        </header>

        {(foldersError || linksError) && (
          <div className="px-5 pt-6">
            <ErrorBanner
              message={linksError ?? foldersError ?? "데이터를 불러오지 못했어요."}
              onRetry={() => {
                void refetchLinks();
                void refetchFolders();
              }}
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between px-5">
          <label className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
            <input
              type="checkbox"
              checked={allFoldersExpanded}
              onChange={(event) => toggleAllFoldersExpanded(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            전체 펼침
          </label>
        </div>

        {loading ? (
          <div className="mt-4 space-y-1">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex min-h-12 animate-pulse items-center gap-3 px-5 py-3">
                <div className="h-9 w-9 rounded-icon bg-bg-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-3/4 rounded-full bg-bg-subtle" />
                </div>
                <div className="h-4 w-4 rounded-full bg-bg-subtle" />
              </div>
            ))}
          </div>
        ) : visibleLinks.length === 0 && sortedFolders.length === 0 ? (
          <div className="mt-4 px-5 py-16 text-center">
            <p className="mb-3 text-lg font-semibold text-gray-400">Linkko</p>
            <p className="text-sm font-medium text-gray-500">
              {currentFolder
                ? `${currentFolder.name}에 저장한 링크가 아직 없어요.`
                : isFavoritesFilter
                  ? "즐겨찾기한 링크가 아직 없어요."
                  : "저장한 링크가 아직 없어요."}
            </p>
            <p className="mt-1 text-xs text-gray-400">아래 버튼으로 첫 링크를 저장해 보세요.</p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-gray-100">
            {linkGroups.map((group) => (
              <FolderAccordionGroup
                key={group.id}
                expanded={expandedFolderIds.has(group.id)}
                favoriteLinkIds={favoriteLinkIds}
                group={group}
                onOpenActions={group.folder ? () => openFolderActions(group.folder!) : undefined}
                onOpenLink={handleOpenLink}
                onOpenLinkDetail={(linkId) => router.push(`/links/${linkId}`)}
                onToggleExpanded={() => toggleFolderExpanded(group.id)}
                onToggleFavoriteLink={toggleFavoriteLink}
              />
            ))}
          </div>
        )}
      </div>

      <AddLinkFab onClick={handleOpenAddLink} />

      <AddLinkModal
        open={addOpen}
        onClose={handleCloseAddLink}
        folders={sortedFolders}
        initialFolderId={currentFolder?.id}
        initialSharedText={sharedText}
        initialUrl={sharedUrl}
        saveSource={isExternalShareEntry ? "external-share" : "in-app"}
        onAdd={handleAdd}
        onCreateFolder={createFolder}
      />

      {folderSheetOpen && activeFolder ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setFolderSheetOpen(false);
              setFolderSheetMode("actions");
              setActiveFolder(null);
              setRenameError("");
            }}
          />

          <BottomSheetShell
            ariaLabel={folderSheetMode === "actions" ? "폴더 관리" : "폴더 이름 변경"}
            onClose={() => {
              setFolderSheetOpen(false);
              setFolderSheetMode("actions");
              setActiveFolder(null);
              setRenameError("");
            }}
          >
            <div className="px-5 pt-3">
              {folderSheetMode === "actions" ? (
                <>
                  <h2 className="mb-1 text-base font-bold text-gray-900">{activeFolder.name}</h2>
                  <p className="mb-5 text-sm text-gray-500">폴더에서 필요한 작업을 선택해 주세요.</p>

                  <div className="space-y-2">
                    <FolderActionButton
                      label="이름 변경"
                      onClick={() => {
                        setFolderSheetMode("rename");
                        setRenameValue(activeFolder.name);
                      }}
                    />
                    <FolderActionButton
                      disabled={folderActionLoading}
                      label="상단 고정"
                      onClick={() => void handlePinCurrentFolder()}
                    />
                    <FolderActionButton
                      destructive
                      label="삭제"
                      onClick={() => {
                        setPendingDeleteFolder(activeFolder);
                        setFolderSheetOpen(false);
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-5 text-lg font-bold text-gray-900">폴더 이름 변경</h2>

                  <div className="space-y-3">
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(event) => {
                        setRenameValue(event.target.value);
                        setRenameError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleRenameCurrentFolder();
                        }
                      }}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />

                    {renameError ? <p className="pl-1 text-xs text-red-500">{renameError}</p> : null}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFolderSheetMode("actions");
                          setRenameError("");
                        }}
                        className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRenameCurrentFolder()}
                        disabled={folderActionLoading}
                        className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                      >
                        {folderActionLoading ? "확인 중..." : "확인"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      <ConfirmModal
        open={pendingDeleteFolder !== null}
        title="폴더를 삭제할까요?"
        message="폴더를 삭제해도 링크는 사라지지 않고 미분류로 돌아가요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => void handleDeleteCurrentFolder()}
        onCancel={() => setPendingDeleteFolder(null)}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function FolderAccordionGroup({
  expanded,
  favoriteLinkIds,
  group,
  onOpenActions,
  onOpenLink,
  onOpenLinkDetail,
  onToggleExpanded,
  onToggleFavoriteLink,
}: {
  expanded: boolean;
  favoriteLinkIds: Set<string>;
  group: LinkFolderGroup;
  onOpenActions?: () => void;
  onOpenLink: (link: LinkType) => void;
  onOpenLinkDetail: (linkId: string) => void;
  onToggleExpanded: () => void;
  onToggleFavoriteLink: (linkId: string) => void;
}) {
  return (
    <section>
      <div className="flex min-h-[52px] items-center px-5">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-expanded={expanded}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 transition ${
              expanded ? "rotate-90" : ""
            }`}
          >
            <ChevronRightIcon />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">
            {group.name}
          </span>
          <span className="shrink-0 text-[12px] font-medium text-gray-400">
            {group.links.length}
          </span>
        </button>

        {onOpenActions ? (
          <button
            type="button"
            onClick={onOpenActions}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:bg-gray-200"
            aria-label={`${group.name} 폴더 메뉴`}
          >
            <DotsIcon />
          </button>
        ) : (
          <span className="ml-3 h-8 w-8 shrink-0" aria-hidden="true" />
        )}
      </div>

      {expanded ? (
        group.links.length > 0 ? (
          <div className="pb-2">
            {group.links.map((link) => (
              <LinkListItem
                key={link.id}
                link={link}
                onOpen={() => onOpenLink(link)}
                rightSlot={
                  <div className="ml-1 flex shrink-0 items-center gap-0.5">
                    <FavoriteStarButton
                      active={favoriteLinkIds.has(link.id)}
                      label={`${link.custom_title ?? link.preview_title ?? "링크"} 즐겨찾기`}
                      onClick={() => onToggleFavoriteLink(link.id)}
                    />
                    <button
                      type="button"
                      onClick={() => onOpenLinkDetail(link.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center text-subtle transition hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      aria-label="링크 상세 보기"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="px-12 pb-4 text-[13px] font-medium text-gray-400">
            저장된 링크가 아직 없어요.
          </p>
        )
      ) : null}
    </section>
  );
}

function FolderActionButton({
  destructive = false,
  disabled = false,
  label,
  onClick,
}: {
  destructive?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        destructive
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      } disabled:opacity-50`}
    >
      <span>{label}</span>
      <ChevronRightIcon />
    </button>
  );
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
