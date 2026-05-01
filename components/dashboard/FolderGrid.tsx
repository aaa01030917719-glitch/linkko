"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { FolderWithCount } from "@/types";

interface FolderGridProps {
  folders: FolderWithCount[];
  onAddLink: (folderId: string) => void;
  onDelete: (id: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}

type SheetMode = "actions" | "rename";

const FOLDER_EMOJIS = ["📁", "💜", "🐱", "📌", "📝", "📚", "🌿", "✨", "🎧", "🔖"];

export default function FolderGrid({
  folders,
  onAddLink,
  onDelete,
  onPin,
  onRename,
}: FolderGridProps) {
  const router = useRouter();
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<FolderWithCount | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] =
    useState<FolderWithCount | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("actions");
  const [renameValue, setRenameValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [renameError, setRenameError] = useState("");

  useEffect(() => {
    if (sheetMode !== "rename") {
      return;
    }

    const timer = window.setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [sheetMode]);

  function openActionSheet(folder: FolderWithCount) {
    setActiveFolder(folder);
    setSheetMode("actions");
    setRenameValue(folder.name);
    setRenameError("");
  }

  function closeActionSheet() {
    setActiveFolder(null);
    setSheetMode("actions");
    setRenameValue("");
    setRenameError("");
    setActionLoading(false);
  }

  async function handleRename() {
    if (!activeFolder) {
      return;
    }

    const trimmedName = renameValue.trim();

    if (!trimmedName) {
      setRenameError("폴더 이름을 입력해 주세요.");
      return;
    }

    setActionLoading(true);
    setRenameError("");

    try {
      await onRename(activeFolder.id, trimmedName);
      closeActionSheet();
    } catch {
      setRenameError("이름을 바꾸지 못했어요. 다시 시도해 주세요.");
      setActionLoading(false);
    }
  }

  async function handlePin() {
    if (!activeFolder) {
      return;
    }

    setActionLoading(true);

    try {
      await onPin(activeFolder.id);
      closeActionSheet();
    } catch {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!pendingDeleteFolder) {
      return;
    }

    setActionLoading(true);

    try {
      await onDelete(pendingDeleteFolder.id);
      setPendingDeleteFolder(null);
      setActionLoading(false);
    } catch {
      setActionLoading(false);
    }
  }

  if (folders.length === 0) {
    return (
      <div className="py-8">
        <p className="text-sm font-semibold text-gray-500">아직 폴더가 없어요.</p>
        <p className="mt-1 text-xs text-gray-400">
          오른쪽 위에서 새 폴더를 만들어 보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {folders.map((folder) => (
          <div key={folder.id} className="flex min-h-12 items-center gap-1 py-1">
            <button
              type="button"
              onClick={() => router.push(`/links?folder=${folder.id}`)}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-2 text-left transition hover:bg-gray-50 active:bg-gray-100"
            >
              <span aria-hidden="true" className="shrink-0 text-lg leading-none">
                {getFolderEmoji(folder)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-gray-900">
                  {folder.name}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {folder.link_count > 0 ? `${folder.link_count}개` : "비어 있음"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openActionSheet(folder)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-100"
              aria-label={`${folder.name} 옵션 열기`}
            >
              <DotsIcon />
            </button>

            <button
              type="button"
              onClick={() => onAddLink(folder.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-500 transition hover:bg-primary-50 active:bg-primary-100"
              aria-label={`${folder.name}에 링크 추가`}
            >
              <PlusIcon />
            </button>
          </div>
        ))}
      </div>

      {activeFolder ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeActionSheet}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              {sheetMode === "actions" ? (
                <>
                  <h2 className="mb-1 text-lg font-bold text-gray-900">
                    {activeFolder.name}
                  </h2>
                  <p className="mb-5 text-sm text-gray-400">
                    폴더에서 필요한 작업을 선택해 주세요.
                  </p>

                  <div className="space-y-2">
                    <ActionButton
                      label="이름 변경"
                      onClick={() => setSheetMode("rename")}
                    />
                    <ActionButton
                      label="상단 고정"
                      onClick={() => void handlePin()}
                      disabled={actionLoading}
                    />
                    <ActionButton
                      label="삭제"
                      tone="danger"
                      onClick={() => {
                        setPendingDeleteFolder(activeFolder);
                        closeActionSheet();
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-5 text-lg font-bold text-gray-900">
                    폴더 이름 변경
                  </h2>

                  <div className="space-y-3">
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(event) => {
                        setRenameValue(event.target.value);
                        setRenameError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleRename();
                        }
                      }}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />

                    {renameError ? (
                      <p className="pl-1 text-xs text-red-500">{renameError}</p>
                    ) : null}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSheetMode("actions")}
                        className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRename()}
                        disabled={actionLoading}
                        className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 shadow-md shadow-primary-500/25"
                      >
                        {actionLoading ? "확인 중..." : "확인"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      <ConfirmModal
        open={pendingDeleteFolder !== null}
        title="폴더를 삭제할까요?"
        message="폴더를 삭제해도 링크는 사라지지 않고 미분류로 남아요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteFolder(null)}
      />
    </>
  );
}

function ActionButton({
  disabled = false,
  label,
  onClick,
  tone = "default",
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        tone === "danger"
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      } disabled:opacity-50`}
    >
      <span>{label}</span>
      <ChevronIcon />
    </button>
  );
}

function getFolderEmoji(folder: FolderWithCount) {
  const key = `${folder.id}:${folder.name}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % FOLDER_EMOJIS.length;
  }

  return FOLDER_EMOJIS[hash];
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
