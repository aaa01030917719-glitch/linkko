"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import FolderGrid from "@/components/dashboard/FolderGrid";
import RecentLinks from "@/components/dashboard/RecentLinks";
import FolderManager from "@/components/folder/FolderManager";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { recordRecentLink } from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import { LINK_OPEN_ERROR_MESSAGE, openLinkTarget } from "@/lib/utils/url";
import { getUserDisplayName } from "@/lib/utils/user";
import type { FolderWithCount, Link as LinkType } from "@/types";

function getSaveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더에 저장했어요` : "링크를 저장했어요";
}

export default function DashboardClient() {
  const [addOpen, setAddOpen] = useState(false);
  const [initialFolderId, setInitialFolderId] = useState<string | null | undefined>(
    undefined,
  );
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const { clearPendingSharedLink, sharedText, sharedUrl } = usePendingSharedLink();
  const {
    favoriteIds: favoriteFolderIds,
    toggleFavorite: toggleFavoriteFolder,
  } = useFavoriteIds("folders", user?.id ?? null);
  const { favoriteIds: favoriteLinkIds } = useFavoriteIds("links", user?.id ?? null);

  const {
    folders,
    error: foldersError,
    createFolder,
    refetch: refetchFolders,
  } = useFolders();
  const {
    links,
    loading,
    error: linksError,
    addLink,
    refetch: refetchLinks,
  } = useLinks();

  const displayName = getUserDisplayName(user);

  const foldersWithCount = useMemo<FolderWithCount[]>(
    () =>
      folders.map((folder) => ({
        ...folder,
        link_count: links.filter((link) => link.folder_id === folder.id).length,
      })),
    [folders, links],
  );

  const sortedFolders = useMemo(
    () =>
      [...foldersWithCount].sort((left, right) => {
        const leftFavorite = favoriteFolderIds.has(left.id) ? 1 : 0;
        const rightFavorite = favoriteFolderIds.has(right.id) ? 1 : 0;

        if (leftFavorite !== rightFavorite) {
          return rightFavorite - leftFavorite;
        }

        if (left.sort_order !== right.sort_order) {
          return left.sort_order - right.sort_order;
        }

        return left.name.localeCompare(right.name, "ko");
      }),
    [favoriteFolderIds, foldersWithCount],
  );

  const visibleFolders = useMemo(() => sortedFolders.slice(0, 5), [sortedFolders]);
  const hasMoreFolders = sortedFolders.length > 5;

  const favoriteLinks = useMemo(
    () => links.filter((link) => favoriteLinkIds.has(link.id)),
    [favoriteLinkIds, links],
  );
  const visibleFavoriteLinks = useMemo(() => favoriteLinks.slice(0, 5), [favoriteLinks]);
  const recentLinks = useMemo(() => links.slice(0, 10), [links]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  async function handleAddLink(
    payload: Partial<LinkType>,
    options?: {
      folderName?: string | null;
      source: "external-share" | "in-app";
    },
  ) {
    try {
      const savedLink = await addLink(payload);
      setAddOpen(false);
      setInitialFolderId(undefined);
      clearPendingSharedLink();
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast(getSaveSuccessMessage(options?.folderName));
      return { savedLinkId: savedLink.id };
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  function handleOpenAddLink(nextFolderId?: string | null) {
    if (!sharedUrl && !sharedText) {
      clearPendingSharedLink();
    }

    setInitialFolderId(nextFolderId);
    setAddOpen(true);
  }

  function handleCloseAddLink() {
    clearPendingSharedLink();
    setInitialFolderId(undefined);
    setAddOpen(false);
  }

  function handleOpenLink(link: LinkType) {
    recordRecentLink(user?.id ?? null, link);
    const openResult = openLinkTarget(link);

    if (openResult === "invalid") {
      showToast(LINK_OPEN_ERROR_MESSAGE);
    }
  }

  return (
    <>
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="px-5 pt-5 pb-1">
          <p className="mb-0.5 text-[11px] font-medium text-muted">환영합니다</p>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">
            {displayName ? `안녕하세요, ${displayName}님 👋` : "안녕하세요 👋"}
          </h1>
        </div>

        {(foldersError || linksError) && (
          <div className="px-5 pt-6">
            <ErrorBanner
              message="데이터를 불러오지 못했어요."
              onRetry={() => {
                void refetchLinks();
                void refetchFolders();
              }}
            />
          </div>
        )}

        <section className="mt-6">
          <SectionHeader
            label="내 폴더"
            actions={
              <>
                {hasMoreFolders ? (
                  <Link
                    href="/folders"
                    className="text-[12px] font-semibold text-brand transition hover:opacity-80"
                  >
                    더보기
                  </Link>
                ) : null}
                <FolderManager onCreate={createFolder} />
              </>
            }
          />
          <FolderGrid
            favoriteFolderIds={favoriteFolderIds}
            folders={visibleFolders}
            onAddLink={(folderId) => handleOpenAddLink(folderId)}
            onToggleFavorite={toggleFavoriteFolder}
          />
        </section>

        <section className="mt-7">
          <SectionHeader label="즐겨찾는 링크" />
          <RecentLinks
            emptyDescription="링크를 별표로 모으면 여기에서 빠르게 다시 열 수 있어요."
            emptyTitle="아직 즐겨찾는 링크가 없어요."
            links={visibleFavoriteLinks}
            loading={loading}
            onOpenLink={handleOpenLink}
          />
        </section>

        <section className="mt-7">
          <SectionHeader label="최근 저장" />
          <RecentLinks
            links={recentLinks}
            loading={loading}
            onOpenLink={handleOpenLink}
            showViewAllButton
            viewAllHref="/links"
            viewAllLabel="전체 링크 보기"
          />
        </section>
      </div>

      <AddLinkFab onClick={() => handleOpenAddLink(undefined)} />

      <AddLinkModal
        open={addOpen}
        onClose={handleCloseAddLink}
        folders={folders}
        initialFolderId={initialFolderId}
        initialSharedText={sharedText}
        initialUrl={sharedUrl}
        saveSource="in-app"
        onAdd={handleAddLink}
        onCreateFolder={createFolder}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function SectionHeader({
  label,
  actions,
}: {
  label: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pb-3">
      <span className="text-section-label uppercase text-muted">{label}</span>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
