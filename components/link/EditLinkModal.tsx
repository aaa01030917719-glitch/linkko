"use client";

import { useEffect, useMemo, useState } from "react";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import FolderSelectSheet from "@/components/ui/FolderSelectSheet";
import FolderSelectTrigger from "@/components/ui/FolderSelectTrigger";
import type { Folder, Link } from "@/types";

interface EditLinkModalProps {
  link: Link | null;
  folders: Folder[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<Link>) => Promise<void>;
}

const UNCATEGORIZED_LABEL = "미분류";
const UNCATEGORIZED_VALUE = "__uncategorized__";

export default function EditLinkModal({
  link,
  folders,
  onClose,
  onSave,
}: EditLinkModalProps) {
  const [customTitle, setCustomTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [folderId, setFolderId] = useState("");
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sortedFolders = useMemo(
    () => [...folders].sort((left, right) => left.sort_order - right.sort_order),
    [folders],
  );

  const selectedFolder = useMemo(
    () => sortedFolders.find((folder) => folder.id === folderId) ?? null,
    [folderId, sortedFolders],
  );

  useEffect(() => {
    if (!link) {
      return;
    }

    setCustomTitle(link.custom_title ?? "");
    setMemo(link.memo ?? "");
    setFolderId(link.folder_id ?? "");
    setFolderSheetOpen(false);
  }, [link]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!link) {
      return;
    }

    setLoading(true);

    try {
      await onSave(link.id, {
        custom_title: customTitle.trim() || null,
        memo: memo.trim() || null,
        folder_id: folderId || null,
      });
      onClose();
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }

  if (!link) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <BottomSheetShell ariaLabel="링크 수정" onClose={onClose}>
        <div className="px-5 pb-2 pt-3">
          <h2 className="mb-5 text-lg font-bold text-gray-900">링크 수정</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                제목
              </label>
              <input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder={link.preview_title?.trim() || "제목을 입력해 주세요"}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                메모
              </label>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={3}
                placeholder="기억하고 싶은 내용을 적어 보세요."
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="space-y-2">
              <label className="block pl-1 text-xs font-semibold text-gray-500">폴더</label>

              <FolderSelectTrigger
                value={selectedFolder?.name ?? UNCATEGORIZED_LABEL}
                muted={!folderId}
                tone={folderId ? "selected" : "neutral"}
                onClick={() => setFolderSheetOpen(true)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </BottomSheetShell>

      <FolderSelectSheet
        open={folderSheetOpen}
        title="폴더 선택"
        folders={sortedFolders}
        value={folderId || UNCATEGORIZED_VALUE}
        onClose={() => setFolderSheetOpen(false)}
        onSelect={(nextValue) => {
          setFolderId(nextValue === UNCATEGORIZED_VALUE ? "" : nextValue);
          setFolderSheetOpen(false);
        }}
        specialOptions={[
          {
            value: UNCATEGORIZED_VALUE,
            label: UNCATEGORIZED_LABEL,
          },
        ]}
      />
    </>
  );
}
