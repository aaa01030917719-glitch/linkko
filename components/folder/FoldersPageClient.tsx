"use client";

import { useMemo, useState } from "react";
import FolderGrid from "@/components/dashboard/FolderGrid";
import FolderManager from "@/components/folder/FolderManager";
import AddLinkModal from "@/components/link/AddLinkModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/useToast";
import type { FolderWithCount, Link } from "@/types";

function getSaveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더에 저장했어요` : "링크를 저장했어요";
}

export default function FoldersPageClient() {
  const [addOpen, setAddOpen] = useState(false);
  const [initialFolderId, setInitialFolderId] = useState<string | null | undefined>(
    undefined,
  );
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const {
    favoriteIds: favoriteFolderIds,
    toggleFavorite: toggleFavoriteFolder,
  } = useFavoriteIds("folders", user?.id ?? null);
  const {
    folders,
    error: foldersError,
    createFolder,
    refetch: refetchFolders,
  } = useFolders();
  const {
    links,
    error: linksError,
    addLink,
    refetch: refetchLinks,
  } = useLinks();

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

  async function handleAddLink(
    payload: Partial<Link>,
    options?: { folderName?: string | null },
  ) {
    try {
      await addLink(payload);
      setAddOpen(false);
      setInitialFolderId(undefined);
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast(getSaveSuccessMessage(options?.folderName));
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  return (
    <>
      <div className="space-y-6 pb-28">
        <header className="flex items-center justify-between pt-2">
          <h2 className="text-2xl font-bold text-gray-900">내 폴더</h2>
          <FolderManager onCreate={createFolder} />
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message={foldersError ?? linksError ?? "데이터를 불러오지 못했어요."}
            onRetry={() => {
              void refetchLinks();
              void refetchFolders();
            }}
          />
        )}

        <FolderGrid
          favoriteFolderIds={favoriteFolderIds}
          folders={sortedFolders}
          onAddLink={(folderId) => {
            setInitialFolderId(folderId);
            setAddOpen(true);
          }}
          onToggleFavorite={toggleFavoriteFolder}
        />
      </div>

      <AddLinkModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setInitialFolderId(undefined);
        }}
        folders={folders}
        initialFolderId={initialFolderId}
        onAdd={handleAddLink}
        onCreateFolder={createFolder}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
