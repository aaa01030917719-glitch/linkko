"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FolderList from "@/components/folder/FolderList";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import EditLinkModal from "@/components/link/EditLinkModal";
import LinkCard from "@/components/link/LinkCard";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { useToast } from "@/hooks/useToast";
import type { Link } from "@/types";

export default function LinksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folder") ?? undefined;
  const querySharedText = searchParams.get("sharedText");
  const querySharedUrl = searchParams.get("sharedUrl");

  const [selectedFolder, setSelectedFolder] = useState<
    string | null | undefined
  >(initialFolder ?? undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const { clearPendingSharedLink, sharedText, sharedUrl } = usePendingSharedLink({
    text: querySharedText,
    url: querySharedUrl,
  });

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
    updateLink,
    deleteLink,
    refetch: refetchLinks,
  } = useLinks(selectedFolder);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  async function handleAdd(payload: Partial<Link>) {
    try {
      await addLink(payload);
      clearSharedEntry();
      showToast("링크가 저장됐어요.");
      setAddOpen(false);
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleUpdate(id: string, payload: Partial<Link>) {
    try {
      await updateLink(id, payload);
      showToast("수정됐어요.");
    } catch {
      showToast("수정하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    try {
      await deleteLink(pendingDeleteId);
      showToast("삭제됐어요.");
    } catch {
      showToast("삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPendingDeleteId(null);
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

    const nextSearchParams = new URLSearchParams();

    if (typeof selectedFolder === "string" && selectedFolder) {
      nextSearchParams.set("folder", selectedFolder);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/links?${nextQuery}` : "/links", {
      scroll: false,
    });
  }

  function handleOpenAddLink() {
    clearSharedEntry();
    setAddOpen(true);
  }

  function handleCloseAddLink() {
    clearSharedEntry();
    setAddOpen(false);
  }

  const currentFolderName =
    selectedFolder === null
      ? "미분류"
      : selectedFolder
        ? folders.find((folder) => folder.id === selectedFolder)?.name
        : undefined;

  return (
    <>
      <div className="space-y-4 pb-36">
        <header className="pt-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentFolderName ?? "링크"}
          </h2>
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message={linksError ?? foldersError ?? "데이터를 불러오지 못했어요."}
            onRetry={() => {
              refetchLinks();
              refetchFolders();
            }}
          />
        )}

        <FolderList
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
        />

        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse gap-3 rounded-2xl border border-gray-100 bg-white p-3"
              >
                <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                  <div className="h-3 w-1/4 rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-lg font-semibold text-gray-400">Linkko</p>
            <p className="text-sm font-medium text-gray-500">
              {selectedFolder === null
                ? "미분류 링크가 아직 없어요."
                : "저장된 링크가 아직 없어요."}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              아래 버튼으로 새 링크를 추가해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onEdit={setEditingLink}
                onDelete={setPendingDeleteId}
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
        initialFolderId={selectedFolder}
        initialSharedText={sharedText}
        initialUrl={sharedUrl}
        onAdd={handleAdd}
        onCreateFolder={createFolder}
      />

      <EditLinkModal
        link={editingLink}
        folders={folders}
        onClose={() => setEditingLink(null)}
        onSave={handleUpdate}
      />

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="링크 삭제"
        message="이 링크를 삭제하면 다시 되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
