"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FolderList from "@/components/folder/FolderList";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import EditLinkModal from "@/components/link/EditLinkModal";
import LinkListItem from "@/components/link/LinkListItem";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { useToast } from "@/hooks/useToast";
import type { Link } from "@/types";

interface SaveOptions {
  folderName?: string | null;
}

function getSaveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더에 저장했어요` : "링크를 저장했어요";
}

function getMoveSuccessMessage(folderName?: string | null) {
  return folderName ? `${folderName} 폴더로 옮겼어요` : "미분류로 옮겼어요";
}

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
  const [actionLink, setActionLink] = useState<Link | null>(null);
  const [movingLink, setMovingLink] = useState<Link | null>(null);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [moveLoading, setMoveLoading] = useState(false);
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

  const currentFolderName = useMemo(() => {
    if (selectedFolder === null) {
      return "미분류";
    }

    if (typeof selectedFolder === "string" && selectedFolder) {
      return folders.find((folder) => folder.id === selectedFolder)?.name;
    }

    return undefined;
  }, [folders, selectedFolder]);

  async function handleAdd(payload: Partial<Link>, options?: SaveOptions) {
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

  async function handleUpdate(id: string, payload: Partial<Link>) {
    try {
      await updateLink(id, payload);
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast("링크를 수정했어요");
    } catch {
      showToast("링크를 수정하지 못했어요. 다시 시도해 주세요.");
      throw new Error("update_failed");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    try {
      await deleteLink(pendingDeleteId);
      await Promise.all([refetchLinks(), refetchFolders()]);
      showToast("링크를 삭제했어요");
    } catch {
      showToast("링크를 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleMoveLink() {
    if (!movingLink) {
      return;
    }

    setMoveLoading(true);

    try {
      const targetFolderId = moveFolderId || null;
      await updateLink(movingLink.id, { folder_id: targetFolderId });
      await Promise.all([refetchLinks(), refetchFolders()]);

      const nextFolderName = targetFolderId
        ? folders.find((folder) => folder.id === targetFolderId)?.name ?? null
        : null;

      setMovingLink(null);
      setMoveFolderId("");
      showToast(getMoveSuccessMessage(nextFolderName));
    } catch {
      showToast("폴더를 옮기지 못했어요. 다시 시도해 주세요.");
    } finally {
      setMoveLoading(false);
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

  function handleOpenLink(link: Link) {
    if (!link.url) {
      return;
    }

    window.open(link.url, "_blank", "noopener,noreferrer");
  }

  function handleOpenActions(link: Link) {
    setActionLink(link);
  }

  function handleCloseActions() {
    setActionLink(null);
  }

  function handleOpenEdit(link: Link) {
    setEditingLink(link);
    setActionLink(null);
  }

  function handleOpenMove(link: Link) {
    setMoveFolderId(link.folder_id ?? "");
    setMovingLink(link);
    setActionLink(null);
  }

  function handleOpenDetail(link: Link) {
    setActionLink(null);
    router.push(`/links/${link.id}`);
  }

  function handleRequestDelete(link: Link) {
    setPendingDeleteId(link.id);
    setActionLink(null);
  }

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
              void refetchLinks();
              void refetchFolders();
            }}
          />
        )}

        <FolderList
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
        />

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
        ) : links.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-lg font-semibold text-gray-400">Linkko</p>
            <p className="text-sm font-medium text-gray-500">
              {selectedFolder === null
                ? "미분류 링크가 아직 없어요"
                : "저장한 링크가 아직 없어요"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              아래 버튼으로 첫 링크를 저장해 보세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {links.map((link) => (
              <LinkListItem
                key={link.id}
                link={link}
                onOpen={() => handleOpenLink(link)}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => handleOpenActions(link)}
                    aria-label="링크 메뉴"
                    className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-200"
                  >
                    <DotsIcon />
                  </button>
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

      {actionLink ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseActions}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">
                링크 관리
              </h2>
              <p className="mb-5 truncate text-sm text-gray-500">
                {actionLink.custom_title ??
                  actionLink.preview_title ??
                  actionLink.url}
              </p>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <ActionButton onClick={() => handleOpenLink(actionLink)}>
                  열기
                </ActionButton>
                <ActionDivider />
                <ActionButton onClick={() => handleOpenEdit(actionLink)}>
                  수정
                </ActionButton>
                <ActionDivider />
                <ActionButton onClick={() => handleOpenMove(actionLink)}>
                  폴더 이동
                </ActionButton>
                <ActionDivider />
                <ActionButton onClick={() => handleOpenDetail(actionLink)}>
                  상세 보기
                </ActionButton>
                <ActionDivider />
                <ActionButton
                  onClick={() => handleRequestDelete(actionLink)}
                  destructive
                >
                  삭제
                </ActionButton>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      {movingLink ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (moveLoading) {
                return;
              }

              setMovingLink(null);
              setMoveFolderId("");
            }}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">
                폴더 이동
              </h2>
              <p className="mb-5 truncate text-sm text-gray-500">
                {movingLink.custom_title ?? movingLink.preview_title ?? movingLink.url}
              </p>

              <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                폴더
              </label>
              <select
                value={moveFolderId}
                onChange={(event) => setMoveFolderId(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">미분류</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (moveLoading) {
                      return;
                    }

                    setMovingLink(null);
                    setMoveFolderId("");
                  }}
                  className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleMoveLink}
                  disabled={moveLoading}
                  className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50"
                >
                  {moveLoading ? "이동 중..." : "이동"}
                </button>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function ActionButton({
  children,
  destructive = false,
  onClick,
}: {
  children: ReactNode;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-left text-sm font-medium transition hover:bg-gray-50 active:bg-gray-100 ${
        destructive ? "text-red-500" : "text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function ActionDivider() {
  return <div className="mx-4 h-px bg-gray-100" />;
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
