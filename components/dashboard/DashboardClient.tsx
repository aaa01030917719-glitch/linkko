"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/hooks/useToast";
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
  const {
    favoriteIds: favoriteLinkIds,
  } = useFavoriteIds("links", user?.id ?? null);

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
  const visibleFavoriteLinks = useMemo(
    () => favoriteLinks.slice(0, 5),
    [favoriteLinks],
  );
  const recentLinks = useMemo(() => links.slice(0, 10), [links]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  async function handleAddLink(
    payload: Partial<LinkType>,
    options?: { folderName?: string | null },
  ) {
    try {
      await addLink(payload);
      setAddOpen(false);
      setInitialFolderId(undefined);
      clearPendingSharedLink();
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast(getSaveSuccessMessage(options?.folderName));
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

  return (
    <>
      <div className="space-y-7 pb-36">
        <header className="pt-2">
          <h2 className="text-2xl font-bold leading-tight text-gray-900">
            {displayName ? `안녕하세요, ${displayName}님 👋` : "안녕하세요 👋"}
          </h2>
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message="데이터를 불러오지 못했어요."
            onRetry={() => {
              void refetchLinks();
              void refetchFolders();
            }}
          />
        )}

        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-gray-600">내 폴더</h3>
            <div className="flex items-center gap-3">
              {hasMoreFolders ? (
                <Link
                  href="/folders"
                  className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
                >
                  더보기
                </Link>
              ) : null}
              <FolderManager onCreate={createFolder} />
            </div>
          </div>
          <FolderGrid
            favoriteFolderIds={favoriteFolderIds}
            folders={visibleFolders}
            onAddLink={(folderId) => handleOpenAddLink(folderId)}
            onToggleFavorite={toggleFavoriteFolder}
          />
        </section>

        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-gray-600">즐겨찾는 링크</h3>
            {favoriteLinks.length > 5 ? (
              <Link
                href="/links"
                className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
              >
                전체 보기
              </Link>
            ) : null}
          </div>
          <RecentLinks
            emptyDescription="링크 목록에서 별 버튼을 누르면 여기에 모여요"
            emptyTitle="아직 즐겨찾는 링크가 없어요"
            links={visibleFavoriteLinks}
            loading={loading}
          />
        </section>

        <section>
          <h3 className="mb-2.5 text-[13px] font-medium text-gray-600">최근 저장</h3>
          <RecentLinks
            links={recentLinks}
            loading={loading}
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
        onAdd={handleAddLink}
        onCreateFolder={createFolder}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
