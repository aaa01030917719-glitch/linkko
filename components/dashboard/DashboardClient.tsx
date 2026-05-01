"use client";

import { useEffect, useMemo, useState } from "react";
import FolderGrid from "@/components/dashboard/FolderGrid";
import NewLinkBanner from "@/components/dashboard/NewLinkBanner";
import RecentLinks from "@/components/dashboard/RecentLinks";
import FolderManager from "@/components/folder/FolderManager";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { useToast } from "@/hooks/useToast";
import { isWithinDays } from "@/lib/utils/time";
import type { Link } from "@/types";

export default function DashboardClient() {
  const [addOpen, setAddOpen] = useState(false);
  const [initialFolderId, setInitialFolderId] = useState<string | null | undefined>(
    undefined,
  );
  const { toast, showToast } = useToast();
  const { clearPendingSharedLink, sharedText, sharedUrl } = usePendingSharedLink();

  const {
    folders,
    error: foldersError,
    createFolder,
    renameFolder,
    deleteFolder,
    pinFolder,
    refetch: refetchFolders,
  } = useFolders();
  const {
    links,
    loading,
    error: linksError,
    addLink,
    refetch: refetchLinks,
  } = useLinks();

  const newLinksCount = useMemo(
    () => links.filter((link) => isWithinDays(link.created_at, 7)).length,
    [links],
  );

  const foldersWithCount = useMemo(
    () =>
      folders.map((folder) => ({
        ...folder,
        link_count: links.filter((link) => link.folder_id === folder.id).length,
      })),
    [folders, links],
  );

  const recentLinks = useMemo(() => links.slice(0, 5), [links]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  async function handleAddLink(payload: Partial<Link>) {
    try {
      await addLink(payload);
      clearPendingSharedLink();
      showToast("링크가 저장됐어요.");
      setInitialFolderId(undefined);
      setAddOpen(false);
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
          <p className="text-base font-medium text-gray-500">안녕하세요</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
            링크{" "}
            <span className="text-primary-500">
              {loading ? (
                <span className="inline-block h-7 w-8 animate-pulse rounded-lg bg-gray-100 align-middle" />
              ) : (
                `${links.length}개`
              )}
            </span>{" "}
            저장됨
          </h2>
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message="데이터를 불러오지 못했어요."
            onRetry={() => {
              refetchLinks();
              refetchFolders();
            }}
          />
        )}

        {!loading && newLinksCount > 0 ? (
          <NewLinkBanner count={newLinksCount} />
        ) : null}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">내 폴더</h3>
            <FolderManager onCreate={createFolder} />
          </div>
          <FolderGrid
            folders={foldersWithCount}
            onAddLink={(folderId) => handleOpenAddLink(folderId)}
            onDelete={deleteFolder}
            onPin={pinFolder}
            onRename={renameFolder}
          />
        </section>

        <section>
          <h3 className="mb-3 text-base font-bold text-gray-900">최근 저장</h3>
          <RecentLinks links={recentLinks} loading={loading} />
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
