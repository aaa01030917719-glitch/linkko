"use client";

import { useState } from "react";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import type { Folder } from "@/types";

interface FolderManagerProps {
  onCreate: (name: string) => Promise<Folder>;
}

export default function FolderManager({ onCreate }: FolderManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("폴더 이름을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreate(trimmedName);
      setName("");
      setOpen(false);
    } catch {
      setError("폴더를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
      >
        새 폴더
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-5 text-lg font-bold text-gray-900">새 폴더</h2>

              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreate();
                    }
                  }}
                  placeholder="폴더 이름"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  autoFocus
                />

                {error ? (
                  <p className="pl-1 text-xs text-red-500">{error}</p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 shadow-md shadow-primary-500/25"
                  >
                    {loading ? "추가 중..." : "추가"}
                  </button>
                </div>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}
    </>
  );
}
