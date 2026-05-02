"use client";

import { useEffect, useState } from "react";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import type { Folder, Link } from "@/types";

interface EditLinkModalProps {
  link: Link | null;
  folders: Folder[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<Link>) => Promise<void>;
}

export default function EditLinkModal({ link, folders, onClose, onSave }: EditLinkModalProps) {
  const [customTitle, setCustomTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [folderId, setFolderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (link) {
      setCustomTitle(link.custom_title ?? link.preview_title ?? "");
      setMemo(link.memo ?? "");
      setFolderId(link.folder_id ?? "");
    }
  }, [link]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!link) return;
    setLoading(true);
    try {
      await onSave(link.id, {
        custom_title: customTitle || null,
        memo: memo || null,
        folder_id: folderId || null,
      });
      onClose();
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }

  if (!link) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <BottomSheetShell>
        <div className="px-5 pb-2 pt-3">
          <h2 className="text-lg font-bold text-gray-900 mb-5">링크 수정</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">제목</label>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="기억하고 싶은 내용..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">폴더</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition bg-white"
              >
                <option value="">미분류</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white hover:bg-primary-600 transition disabled:opacity-50 shadow-md shadow-primary-500/25"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </BottomSheetShell>
    </>
  );
}
