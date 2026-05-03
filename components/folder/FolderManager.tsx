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
        className="text-[12px] font-semibold text-brand transition hover:opacity-80"
      >
        + 새 폴더
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setOpen(false)} />

          <BottomSheetShell ariaLabel="새 폴더" onClose={() => setOpen(false)}>
            <div className="px-5 pt-3">
              <h2 className="mb-5 text-lg font-semibold text-ink">새 폴더</h2>

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
                  className="w-full rounded-[10px] border border-border-card px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
                  autoFocus
                />

                {error ? <p className="pl-1 text-xs text-danger">{error}</p> : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-border-card bg-white py-3 text-sm font-semibold text-body transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={loading}
                    className="flex-1 rounded-md bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
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
