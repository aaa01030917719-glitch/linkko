"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import FavoriteStarButton from "@/components/ui/FavoriteStarButton";
import { cn } from "@/lib/utils/cn";
import type { Folder } from "@/types";

export interface FolderSelectSpecialOption {
  value: string;
  label: string;
}

interface FolderSelectSheetProps {
  open: boolean;
  title: string;
  folders: Folder[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void | Promise<void>;
  specialOptions?: FolderSelectSpecialOption[];
  favoriteFolderIds?: Set<string>;
  onToggleFavorite?: (folderId: string) => void;
  onCreateFolder?: (name: string) => Promise<Folder>;
  onFolderCreated?: (folder: Folder) => void;
  createLabel?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

type SheetMode = "list" | "create";

export default function FolderSelectSheet({
  open,
  title,
  folders,
  value,
  onClose,
  onSelect,
  specialOptions = [],
  favoriteFolderIds,
  onToggleFavorite,
  onCreateFolder,
  onFolderCreated,
  createLabel = "새 폴더 만들기",
  emptyMessage = "폴더가 없어요.",
  disabled = false,
}: FolderSelectSheetProps) {
  const [mode, setMode] = useState<SheetMode>("list");
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectingValue, setSelectingValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedFolders = useMemo(
    () => [...folders].sort((left, right) => left.sort_order - right.sort_order),
    [folders],
  );

  useEffect(() => {
    if (!open) {
      setMode("list");
      setCreateName("");
      setCreateError("");
      setCreating(false);
      setSelectingValue(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "create") {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [mode, open]);

  async function handleSelect(nextValue: string) {
    if (disabled || selectingValue) {
      return;
    }

    setSelectingValue(nextValue);

    try {
      await onSelect(nextValue);
    } finally {
      setSelectingValue(null);
    }
  }

  async function handleCreateFolder() {
    if (!onCreateFolder || creating) {
      return;
    }

    const trimmedName = createName.trim();

    if (!trimmedName) {
      setCreateError("폴더 이름을 입력해 주세요.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const createdFolder = await onCreateFolder(trimmedName);
      onFolderCreated?.(createdFolder);
      await onSelect(createdFolder.id);
      onClose();
    } catch {
      setCreateError("폴더를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setCreating(false);
    }
  }

  if (!open) {
    return null;
  }

  const canClose = !creating && !selectingValue && !disabled;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (canClose) {
            onClose();
          }
        }}
      />

      <BottomSheetShell ariaLabel={title} onClose={canClose ? onClose : undefined}>
        <div className="px-5 pt-3">
          {mode === "list" ? (
            <>
              <h2 className="mb-5 text-lg font-bold text-gray-900">{title}</h2>

              <div className="space-y-1">
                {specialOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={value === option.value}
                    disabled={disabled || selectingValue !== null}
                    label={option.label}
                    onClick={() => {
                      void handleSelect(option.value);
                    }}
                  />
                ))}

                {sortedFolders.length > 0 ? (
                  <div className={cn("space-y-1", specialOptions.length > 0 && "pt-2")}>
                    {specialOptions.length > 0 ? (
                      <p className="mb-2 pl-1 text-xs font-semibold text-gray-400">
                        폴더
                      </p>
                    ) : null}

                    {sortedFolders.map((folder) => (
                      <FolderOptionRow
                        key={folder.id}
                        active={value === folder.id}
                        disabled={disabled || selectingValue !== null}
                        favorite={favoriteFolderIds?.has(folder.id) ?? false}
                        label={folder.name}
                        onSelect={() => {
                          void handleSelect(folder.id);
                        }}
                        onToggleFavorite={
                          onToggleFavorite
                            ? () => {
                                onToggleFavorite(folder.id);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : specialOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    {emptyMessage}
                  </div>
                ) : null}
              </div>

              {onCreateFolder ? (
                <button
                  type="button"
                  disabled={disabled || selectingValue !== null}
                  onClick={() => {
                    setMode("create");
                    setCreateName("");
                    setCreateError("");
                  }}
                  className="mt-4 flex w-full items-center justify-center rounded-lg border border-dashed border-primary-200 bg-primary-50/60 px-4 py-3 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 disabled:opacity-50"
                >
                  {createLabel}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (creating) {
                      return;
                    }

                    setMode("list");
                    setCreateError("");
                  }}
                  className="-ml-1 p-1 text-gray-400 transition hover:text-gray-600"
                  aria-label="이전으로"
                >
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-gray-900">{createLabel}</h2>
              </div>

              <div className="space-y-3">
                <input
                  ref={inputRef}
                  value={createName}
                  onChange={(event) => {
                    setCreateName(event.target.value);
                    setCreateError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreateFolder();
                    }
                  }}
                  placeholder="새 폴더 이름"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />

                {createError ? (
                  <p className="pl-1 text-xs text-red-500">{createError}</p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (creating) {
                        return;
                      }

                      setMode("list");
                      setCreateError("");
                    }}
                    className="flex-1 rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      void handleCreateFolder();
                    }}
                    className="flex-1 rounded-lg bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                  >
                    {creating ? "만드는 중..." : "확인"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </BottomSheetShell>
    </>
  );
}

function OptionButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-left text-sm transition disabled:opacity-50",
        active
          ? "border border-primary-200 bg-primary-50 font-semibold text-primary-600"
          : "border border-transparent text-gray-700 hover:bg-gray-50",
      )}
    >
      <span>{label}</span>
      {active ? <CheckIcon /> : null}
    </button>
  );
}

function FolderOptionRow({
  active,
  disabled,
  favorite,
  label,
  onSelect,
  onToggleFavorite,
}: {
  active: boolean;
  disabled: boolean;
  favorite: boolean;
  label: string;
  onSelect: () => void;
  onToggleFavorite?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2.5 transition",
        active ? "border border-primary-200 bg-primary-50" : "border border-transparent hover:bg-gray-50",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="flex min-h-[36px] min-w-0 flex-1 items-center justify-between gap-3 text-left text-sm disabled:opacity-50"
      >
        <span className={cn("truncate", active ? "font-semibold text-primary-600" : "font-medium text-gray-700")}>
          {label}
        </span>
        {active ? <CheckIcon /> : null}
      </button>

      {onToggleFavorite ? (
        <FavoriteStarButton
          active={favorite}
          label={`${label} 폴더 즐겨찾기`}
          onClick={onToggleFavorite}
        />
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
