"use client";

import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Folder } from "@/types";

interface FolderManagerProps {
  folders: Folder[];
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function FolderManager({ folders, onCreate, onRename, onDelete }: FolderManagerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await onRename(id, editName.trim());
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setLoading(true);
    try {
      await onDelete(pendingDeleteId);
    } finally {
      setPendingDeleteId(null);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary-500 hover:text-primary-600 transition px-1 py-0.5"
      >
        편집
      </button>

      {/* 폴더 관리 시트 */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8 pt-3">
              <h2 className="text-lg font-bold text-gray-900 mb-5">폴더 관리</h2>

              {/* 폴더 추가 */}
              <form onSubmit={handleCreate} className="flex gap-2 mb-5">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="새 폴더 이름"
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
                <button
                  type="submit"
                  disabled={loading || !newName.trim()}
                  className="rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-40 transition shadow-md shadow-primary-500/25"
                >
                  추가
                </button>
              </form>

              {/* 폴더 목록 */}
              <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                {folders.map((folder) => (
                  <li key={folder.id}>
                    {editingId === folder.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-2xl border border-primary-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(folder.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRename(folder.id)}
                          disabled={loading}
                          className="rounded-xl bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-2 px-1 rounded-xl hover:bg-gray-50">
                        <span className="text-sm font-medium text-gray-800">{folder.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
                            className="text-xs text-gray-400 hover:text-gray-700 transition px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(folder.id)}
                            disabled={loading}
                            className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50 px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {folders.length === 0 && (
                  <li className="text-center text-sm text-gray-400 py-6">
                    폴더가 없어요. 위에서 만들어보세요!
                  </li>
                )}
              </ul>

              <button
                onClick={() => setOpen(false)}
                className="mt-5 w-full rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}

      {/* 폴더 삭제 확인 모달 */}
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="폴더 삭제"
        message="폴더를 삭제해도 링크는 삭제되지 않아요. 해당 링크는 미분류로 이동돼요."
        confirmLabel="삭제"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
