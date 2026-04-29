"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/useToast";
import FolderList from "@/components/folder/FolderList";
import LinkCard from "@/components/link/LinkCard";
import AddLinkModal from "@/components/link/AddLinkModal";
import EditLinkModal from "@/components/link/EditLinkModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import type { Link } from "@/types";

export default function LinksClient() {
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folder") ?? undefined;

  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(
    initialFolder ?? undefined
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const {
    folders,
    error: foldersError,
    createFolder,
    refetch: refetchFolders,
  } = useFolders();
  const { links, loading, error: linksError, addLink, updateLink, deleteLink, refetch: refetchLinks } = useLinks(selectedFolder);

  async function handleAdd(payload: Partial<Link>) {
    try {
      await addLink(payload);
      showToast("링크가 저장됐어요 🎉");
      setAddOpen(false);
    } catch {
      showToast("저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  async function handleUpdate(id: string, payload: Partial<Link>) {
    try {
      await updateLink(id, payload);
      showToast("수정됐어요");
    } catch {
      showToast("수정에 실패했어요. 다시 시도해주세요.");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    try {
      await deleteLink(pendingDeleteId);
      showToast("삭제됐어요");
    } catch {
      showToast("삭제에 실패했어요. 다시 시도해주세요.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  const currentFolderName =
    selectedFolder === null
      ? "미분류"
      : selectedFolder
        ? folders.find((f) => f.id === selectedFolder)?.name
        : undefined;

  return (
    <>
      <div className="space-y-4 pb-36">
        {/* 헤더 */}
        <header className="pt-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentFolderName ?? "링크"}
          </h2>
        </header>

        {/* 에러 */}
        {(foldersError || linksError) && (
          <ErrorBanner
            message={linksError ?? foldersError ?? undefined}
            onRetry={() => { refetchLinks(); refetchFolders(); }}
          />
        )}

        {/* 폴더 필터 */}
        <FolderList
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
        />

        {/* 링크 목록 */}
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔗</p>
            <p className="text-sm font-medium text-gray-500">
              {selectedFolder === null ? "미분류 링크가 없어요" : "저장된 링크가 없어요"}
            </p>
            <p className="text-xs text-gray-400 mt-1">아래 버튼으로 추가해보세요</p>
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

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-16 inset-x-0 z-20 px-4 pb-2 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-2xl bg-primary-500 py-4 text-sm font-bold text-white
              shadow-xl shadow-primary-500/35 hover:bg-primary-600 active:bg-primary-700
              transition flex items-center justify-center gap-2"
          >
            <PlusIcon />
            링크 저장
          </button>
        </div>
      </div>

      <AddLinkModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        folders={folders}
        onAdd={handleAdd}
        onCreateFolder={createFolder}
      />
      <EditLinkModal link={editingLink} folders={folders} onClose={() => setEditingLink(null)} onSave={handleUpdate} />
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="링크 삭제"
        message="이 링크를 삭제하면 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      {toast && <Toast message={toast} />}
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
