"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import LinkListItem from "@/components/link/LinkListItem";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FavoriteStarButton from "@/components/ui/FavoriteStarButton";
import FilterChip from "@/components/ui/FilterChip";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { recordRecentFolder, recordRecentLink } from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import { openLinkTarget } from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

interface SaveOptions {
  folderName?: string | null;
}

type FolderSheetMode = "actions" | "rename";

function getSaveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더에 저장했어요` : "링크를 저장했어요";
}

function sortLinksByFavoriteAndRecency(
  sourceLinks: LinkType[],
  favoriteIds: Set<string>,
) {
  return [...sourceLinks].sort((left, right) => {
    const favoriteDiff =
      Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id));

    if (favoriteDiff !== 0) {
      return favoriteDiff;
    }

    return (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
  });
}

function sortFoldersByFavoriteAndOrder(
  sourceFolders: Folder[],
  favoriteIds: Set<string>,
) {
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

export default function LinksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");
  const querySharedText = searchParams.get("sharedText");
  const querySharedUrl = searchParams.get("sharedUrl");

  const renameInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const [folderSheetMode, setFolderSheetMode] =
    useState<FolderSheetMode>("actions");
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [folderActionLoading, setFolderActionLoading] = useState(false);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<Folder | null>(
    null,
  );
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
  } = useLinks(currentFolder ? currentFolder.id : undefined);

  const sortedFolders = useMemo(
    () => sortFoldersByFavoriteAndOrder(folders, favoriteFolderIds),
    [favoriteFolderIds, folders],
  );

  const visibleLinks = useMemo(
    () => sortLinksByFavoriteAndRecency(links, favoriteLinkIds),
    [favoriteLinkIds, links],
  );

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  useEffect(() => {
    if (folderParam && folders.length > 0 && !currentFolder) {
      router.replace("/links", { scroll: false });
    }
  }, [currentFolder, folderParam, folders.length, router]);

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
    if (!folderSheetOpen || !currentFolder) {
      return;
    }

    setRenameValue(currentFolder.name);
  }, [currentFolder, folderSheetOpen]);

  useEffect(() => {
    if (!currentFolder) {
      return;
    }

    recordRecentFolder(user?.id ?? null, {
      id: currentFolder.id,
      name: currentFolder.name,
    });
  }, [currentFolder, user?.id]);

  function buildLinksPath(nextFolderId?: string | null) {
    const nextSearchParams = new URLSearchParams();

    for (const key of ["shared", "sharedText", "sharedUrl", "t"]) {
      const value = searchParams.get(key);
      if (value) {
        nextSearchParams.set(key, value);
      }
    }

    if (nextFolderId) {
      nextSearchParams.set("folder", nextFolderId);
    }

    const nextQuery = nextSearchParams.toString();
    return nextQuery ? `/links?${nextQuery}` : "/links";
  }

  function replaceFilter(nextFolderId?: string | null) {
    router.replace(buildLinksPath(nextFolderId), { scroll: false });
  }

  async function handleAdd(payload: Partial<LinkType>, options?: SaveOptions) {
    try {
      await addLink(payload);
      setAddOpen(false);
      clearSharedEntry();
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast(getSaveSuccessMessage(options?.folderName));
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleRenameCurrentFolder() {
    if (!currentFolder) {
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
      await renameFolder(currentFolder.id, trimmedName);
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
    if (!currentFolder) {
      return;
    }

    setFolderActionLoading(true);

    try {
      await pinFolder(currentFolder.id);
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
      router.replace("/links");
      await Promise.all([refetchFolders(), refetchLinks()]);
      showToast("폴더를 삭제했어요.");
    } catch {
      showToast("폴더를 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setFolderActionLoading(false);
    }
  }

  function clearSharedEntry() {
    clearPendingSharedLink();

    if (
      !searchParams.has("shared") &&
      !searchParams.has("sharedText") &&
      !searchParams.has("sharedUrl") &&
      !searchParams.has("t")
    ) {
      return;
    }

    router.replace(buildLinksPath(currentFolder?.id), { scroll: false });
  }

  function handleOpenAddLink() {
    clearSharedEntry();
    setAddOpen(true);
  }

  function handleCloseAddLink() {
    clearSharedEntry();
    setAddOpen(false);
  }

  function handleOpenLink(link: LinkType) {
    recordRecentLink(user?.id ?? null, link);
    const openResult = openLinkTarget(link.url);

    if (openResult === "invalid") {
      showToast("열 수 없는 링크예요.");
    }
  }

  return (
    <>
      <div className="space-y-4 pb-36">
        <header className="space-y-2 pt-2">
          <h2 className="text-2xl font-bold text-gray-900">저장한 링크</h2>
          <p className="text-sm text-gray-500">필요할 때 다시 열어보세요</p>
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message={linksError ?? foldersError ?? "데이터를 불러오지 못했어요."}
            onRetry={() => {
              void refetchLinks();
              void refetchFolders();
            }}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <FilterChip
            active
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
            onClick={() => setFilterSheetOpen(true)}
          >
            <span>{currentFolder?.name ?? "전체"}</span>
            <ChevronDownIcon />
          </FilterChip>

          {currentFolder ? (
            <button
              type="button"
              onClick={() => {
                setFolderSheetOpen(true);
                setFolderSheetMode("actions");
                setRenameValue(currentFolder.name);
                setRenameError("");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-200"
              aria-label={`${currentFolder.name} 폴더 메뉴`}
            >
              <DotsIcon />
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-1">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="flex min-h-12 items-center gap-3 py-2 animate-pulse"
              >
                <div className="h-6 w-6 rounded-full bg-gray-100" />
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
                  <div className="mt-2 h-2.5 w-1/3 rounded-full bg-gray-100" />
                </div>
                <div className="h-4 w-4 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        ) : visibleLinks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-lg font-semibold text-gray-400">Linkko</p>
            <p className="text-sm font-medium text-gray-500">
              {currentFolder
                ? `${currentFolder.name}에 저장된 링크가 아직 없어요.`
                : "저장한 링크가 아직 없어요."}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              아래 버튼으로 첫 링크를 저장해 보세요.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleLinks.map((link) => (
              <LinkListItem
                key={link.id}
                link={link}
                onOpen={() => handleOpenLink(link)}
                rightSlot={
                  <FavoriteStarButton
                    active={favoriteLinkIds.has(link.id)}
                    label={`${link.custom_title ?? link.preview_title ?? "링크"} 즐겨찾기`}
                    onClick={() => toggleFavoriteLink(link.id)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <AddLinkFab onClick={handleOpenAddLink} />

      <AddLinkModal
        open={addOpen}
        onClose={handleCloseAddLink}
        folders={folders}
        initialFolderId={currentFolder?.id}
        initialSharedText={sharedText}
        initialUrl={sharedUrl}
        onAdd={handleAdd}
        onCreateFolder={createFolder}
      />

      {filterSheetOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setFilterSheetOpen(false)}
          />

          <BottomSheetShell contentClassName="px-5 pt-3">
            <h2 className="mb-5 text-lg font-bold text-gray-900">폴더 선택</h2>

            <div className="space-y-1">
              <FilterOptionButton
                active={!currentFolder}
                label="전체"
                onClick={() => {
                  setFilterSheetOpen(false);
                  replaceFilter(undefined);
                }}
              />

              {sortedFolders.length > 0 ? (
                <div className="pt-2">
                  <p className="mb-2 pl-1 text-xs font-semibold text-gray-400">
                    내 폴더
                  </p>
                  <div className="space-y-1">
                    {sortedFolders.map((folder) => (
                      <FolderFilterRow
                        key={folder.id}
                        active={currentFolder?.id === folder.id}
                        favorite={favoriteFolderIds.has(folder.id)}
                        label={folder.name}
                        onSelect={() => {
                          setFilterSheetOpen(false);
                          replaceFilter(folder.id);
                        }}
                        onToggleFavorite={() => toggleFavoriteFolder(folder.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      {folderSheetOpen && currentFolder ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setFolderSheetOpen(false);
              setFolderSheetMode("actions");
              setRenameError("");
            }}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              {folderSheetMode === "actions" ? (
                <>
                  <h2 className="mb-1 text-lg font-bold text-gray-900">
                    {currentFolder.name}
                  </h2>
                  <p className="mb-5 text-sm text-gray-400">
                    폴더에서 필요한 작업을 선택해 주세요.
                  </p>

                  <div className="space-y-2">
                    <FolderActionButton
                      label="이름 변경"
                      onClick={() => {
                        setFolderSheetMode("rename");
                        setRenameValue(currentFolder.name);
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
                        setPendingDeleteFolder(currentFolder);
                        setFolderSheetOpen(false);
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-5 text-lg font-bold text-gray-900">
                    폴더 이름 변경
                  </h2>

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

                    {renameError ? (
                      <p className="pl-1 text-xs text-red-500">{renameError}</p>
                    ) : null}

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

function FilterOptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition ${
        active
          ? "bg-primary-50 font-semibold text-primary-600"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span>{label}</span>
      {active ? <CheckIcon /> : null}
    </button>
  );
}

function FolderFilterRow({
  active,
  favorite,
  label,
  onSelect,
  onToggleFavorite,
}: {
  active: boolean;
  favorite: boolean;
  label: string;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition ${
        active
          ? "bg-primary-50 text-primary-600"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={`min-w-0 flex-1 truncate ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
      <FavoriteStarButton
        active={favorite}
        label={`${label} 폴더 즐겨찾기`}
        onClick={onToggleFavorite}
      />
    </button>
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

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
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

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
