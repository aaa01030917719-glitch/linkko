"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PreviewThumbnail from "@/components/link/PreviewThumbnail";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import { isValidUrl } from "@/lib/utils/url";
import type { Folder, Link, LinkPreview } from "@/types";

interface AddLinkModalProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  initialFolderId?: string | null;
  initialSharedText?: string | null;
  initialUrl?: string | null;
  onAdd: (
    payload: Partial<Link>,
    options?: { folderName?: string | null },
  ) => Promise<void>;
  onCreateFolder: (name: string) => Promise<Folder>;
}

type Step = "url" | "detail";
type FolderResolutionResult =
  | { ok: true; folderId: string | null; folderName: string | null }
  | { ok: false };

const UNCATEGORIZED_LABEL = "미분류";

function buildMemoCandidate(sharedText?: string | null, sharedUrl?: string | null) {
  const trimmedSharedText = sharedText?.trim() || "";

  if (!trimmedSharedText) {
    return null;
  }

  if (!sharedUrl) {
    return trimmedSharedText;
  }

  const trimmedSharedUrl = sharedUrl.trim();
  const remainingText = trimmedSharedText
    .split(trimmedSharedUrl)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return remainingText || null;
}

export default function AddLinkModal({
  open,
  onClose,
  folders,
  initialFolderId,
  initialSharedText,
  initialUrl,
  onAdd,
  onCreateFolder,
}: AddLinkModalProps) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [folderId, setFolderId] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [availableFolders, setAvailableFolders] = useState<Folder[]>(folders);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [isEditingFolderName, setIsEditingFolderName] = useState(false);
  const [folderDraftName, setFolderDraftName] = useState("");
  const [urlError, setUrlError] = useState("");
  const [folderError, setFolderError] = useState("");

  const urlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const preparedSharedSignatureRef = useRef<string | null>(null);

  const sharedMemoCandidate = useMemo(
    () => buildMemoCandidate(initialSharedText, initialUrl),
    [initialSharedText, initialUrl],
  );

  const sortedFolders = useMemo(
    () => sortFolders(availableFolders),
    [availableFolders],
  );

  const selectedFolder = useMemo(
    () => sortedFolders.find((folder) => folder.id === folderId) ?? null,
    [folderId, sortedFolders],
  );

  const selectedFolderLabel = selectedFolder?.name ?? UNCATEGORIZED_LABEL;

  useEffect(() => {
    setAvailableFolders(folders);
  }, [folders]);

  useEffect(() => {
    if (!open) {
      preparedSharedSignatureRef.current = null;
      resetModal();
      return;
    }

    if (initialFolderId !== undefined) {
      setFolderId(initialFolderId ?? "");
    }

    if (initialUrl) {
      return;
    }

    const timer = window.setTimeout(() => {
      urlInputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [folders, initialFolderId, initialUrl, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedUrl = initialUrl?.trim() || null;
    const normalizedMemo = sharedMemoCandidate?.trim() || null;
    const nextSignature = JSON.stringify({
      memo: normalizedMemo,
      url: normalizedUrl,
    });

    if (preparedSharedSignatureRef.current === nextSignature) {
      return;
    }

    preparedSharedSignatureRef.current = nextSignature;

    if (normalizedMemo) {
      setMemo((currentMemo) => currentMemo || normalizedMemo);
    }

    if (!normalizedUrl) {
      return;
    }

    setUrl(normalizedUrl);
    void prepareLinkDetails(normalizedUrl, normalizedMemo);
  }, [initialUrl, open, sharedMemoCandidate]);

  useEffect(() => {
    if (isEditingFolderName) {
      return;
    }

    setFolderDraftName(selectedFolder?.name ?? "");
  }, [isEditingFolderName, selectedFolder]);

  useEffect(() => {
    if (!isEditingFolderName) {
      return;
    }

    const timer = window.setTimeout(() => {
      folderInputRef.current?.focus();
      folderInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isEditingFolderName]);

  function resetModal() {
    setStep("url");
    setUrl("");
    setCustomTitle("");
    setMemo("");
    setFolderId(initialFolderId ?? "");
    setPreview(null);
    setAvailableFolders(folders);
    setFetchingPreview(false);
    setSavingLink(false);
    setCreatingFolder(false);
    setIsEditingFolderName(false);
    setFolderDraftName("");
    setUrlError("");
    setFolderError("");
  }

  async function prepareLinkDetails(
    nextUrl: string,
    nextMemoCandidate?: string | null,
  ) {
    if (!isValidUrl(nextUrl)) {
      setUrlError("올바른 URL을 입력해 주세요. (https://...)");
      return;
    }

    setUrl(nextUrl);
    setUrlError("");
    setFetchingPreview(true);

    if (nextMemoCandidate) {
      setMemo((currentMemo) => currentMemo || nextMemoCandidate);
    }

    try {
      const response = await fetch(
        `/api/preview?url=${encodeURIComponent(nextUrl)}`,
      );

      if (!response.ok) {
        setPreview(null);
      } else {
        const data: LinkPreview = await response.json();
        setPreview(data);
        setCustomTitle((currentTitle) => currentTitle || data.title || "");
      }
    } catch {
      setPreview(null);
    } finally {
      setFetchingPreview(false);
      setStep("detail");
    }
  }

  async function handlePreviewFetch(event: React.FormEvent) {
    event.preventDefault();
    await prepareLinkDetails(url, sharedMemoCandidate);
  }

  async function resolveFolderSelection(): Promise<FolderResolutionResult> {
    if (!isEditingFolderName) {
      return {
        ok: true,
        folderId: folderId || null,
        folderName: selectedFolder?.name ?? null,
      };
    }

    const trimmedName = folderDraftName.trim();

    if (!trimmedName) {
      setFolderError("폴더 이름을 입력해 주세요.");
      return { ok: false };
    }

    if (trimmedName === UNCATEGORIZED_LABEL) {
      setFolderId("");
      setFolderDraftName("");
      setIsEditingFolderName(false);
      setFolderError("");
      return { ok: true, folderId: null, folderName: null };
    }

    const existingFolder = sortedFolders.find(
      (folder) => normalizeFolderName(folder.name) === normalizeFolderName(trimmedName),
    );

    if (existingFolder) {
      setFolderId(existingFolder.id);
      setFolderDraftName(existingFolder.name);
      setIsEditingFolderName(false);
      setFolderError("");
      return {
        ok: true,
        folderId: existingFolder.id,
        folderName: existingFolder.name,
      };
    }

    setCreatingFolder(true);
    setFolderError("");

    try {
      const createdFolder = await onCreateFolder(trimmedName);

      setAvailableFolders((currentFolders) =>
        sortFolders(upsertFolder(currentFolders, createdFolder)),
      );
      setFolderId(createdFolder.id);
      setFolderDraftName(createdFolder.name);
      setIsEditingFolderName(false);
      return {
        ok: true,
        folderId: createdFolder.id,
        folderName: createdFolder.name,
      };
    } catch {
      setFolderError("폴더를 만들지 못했어요. 다시 시도해 주세요.");
      return { ok: false };
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    const resolvedFolder = await resolveFolderSelection();

    if (!resolvedFolder.ok) {
      return;
    }

    setSavingLink(true);

    try {
      await onAdd({
        url,
        custom_title: customTitle || null,
        memo: memo || null,
        folder_id: resolvedFolder.folderId,
        preview_title: preview?.title ?? null,
        preview_description: preview?.description ?? null,
        preview_image: preview?.image ?? null,
        preview_site_name: preview?.site_name ?? null,
      }, {
        folderName: resolvedFolder.folderName,
      });
    } finally {
      setSavingLink(false);
    }
  }

  function beginFolderNameEditing() {
    setFolderDraftName(selectedFolder?.name ?? "");
    setFolderError("");
    setIsEditingFolderName(true);
  }

  async function handleConfirmFolderName() {
    await resolveFolderSelection();
  }

  function handleFolderNameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void handleConfirmFolderName();
  }

  function handleSelectFolder(nextFolderId: string) {
    setFolderId(nextFolderId);
    setIsEditingFolderName(false);
    setFolderError("");
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {step === "url" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-5">
              <h2 className="mb-5 text-lg font-bold text-gray-900">
                링크 가져오기
              </h2>

              <form onSubmit={handlePreviewFetch} className="space-y-3">
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        setUrlError("");
                      }}
                      placeholder="https://..."
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                        urlError
                          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      }`}
                    />
                    {url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUrl("");
                          setUrlError("");
                        }}
                        className="px-1 text-gray-300 transition hover:text-gray-500"
                        aria-label="입력한 URL 지우기"
                      >
                        <ClearIcon />
                      </button>
                    ) : null}
                  </div>

                  {urlError ? (
                    <p className="mt-1.5 pl-1 text-xs text-red-500">{urlError}</p>
                  ) : null}

                  {!url && sharedMemoCandidate && !initialUrl ? (
                    <p className="mt-2 pl-1 text-xs text-gray-500">
                      공유한 텍스트는 메모로 넣어 둘게요. 링크만 붙여 넣으면 바로
                      이어서 저장할 수 있어요.
                    </p>
                  ) : null}
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
                    disabled={!url || fetchingPreview}
                    className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 disabled:opacity-40"
                  >
                    {fetchingPreview ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        불러오는 중
                      </span>
                    ) : (
                      "다음"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <BottomSheetShell>
          <div
            className="px-5 pb-2 pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("url")}
                className="-ml-1 p-1 text-gray-400 transition hover:text-gray-600"
              >
                <BackIcon />
              </button>
              <h2 className="text-lg font-bold text-gray-900">링크 저장</h2>
            </div>

            {preview?.image || preview?.title ? (
              <div className="mb-4 flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <PreviewThumbnail
                  image={preview?.image ?? null}
                  title={preview?.title ?? "링크 미리보기"}
                  siteName={preview?.site_name ?? null}
                  url={url}
                  className="h-14 w-14 rounded-xl"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-800">
                    {preview?.title}
                  </p>
                  {preview?.site_name ? (
                    <p className="mt-1 text-xs text-gray-400">
                      {preview.site_name}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                  제목
                </label>
                <input
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="제목을 적어 주세요"
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
                  placeholder="나중에 다시 볼 때 기억할 내용을 적어 보세요"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block pl-1 text-xs font-semibold text-gray-500">
                  폴더
                </label>

                {isEditingFolderName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={folderInputRef}
                      value={folderDraftName}
                      onChange={(event) => {
                        setFolderDraftName(event.target.value);
                        setFolderError("");
                      }}
                      onKeyDown={handleFolderNameKeyDown}
                      placeholder="새 폴더 이름"
                      className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      type="button"
                      onClick={() => void handleConfirmFolderName()}
                      disabled={creatingFolder}
                      className="shrink-0 rounded-2xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                    >
                      {creatingFolder ? "확인 중..." : "확인"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={beginFolderNameEditing}
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left text-sm transition hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <span className={folderId ? "text-gray-900" : "text-gray-500"}>
                      {selectedFolderLabel}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      눌러서 입력
                    </span>
                  </button>
                )}

                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  <FolderChip
                    active={folderId === ""}
                    onClick={() => handleSelectFolder("")}
                  >
                    {UNCATEGORIZED_LABEL}
                  </FolderChip>
                  {sortedFolders.map((folder) => (
                    <FolderChip
                      key={folder.id}
                      active={folder.id === folderId}
                      onClick={() => handleSelectFolder(folder.id)}
                    >
                      {folder.name}
                    </FolderChip>
                  ))}
                </div>

                {folderError ? (
                  <p className="pl-1 text-xs text-red-500">{folderError}</p>
                ) : null}
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
                  disabled={savingLink || creatingFolder}
                  className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 disabled:opacity-50"
                >
                  {savingLink ? <Spinner className="mx-auto" /> : "저장"}
                </button>
              </div>
            </form>
          </div>
        </BottomSheetShell>
      )}
    </>
  );
}

function FolderChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary-50 text-primary-600 ring-1 ring-primary-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function upsertFolder(folders: Folder[], nextFolder: Folder) {
  const withoutExisting = folders.filter((folder) => folder.id !== nextFolder.id);
  return [...withoutExisting, nextFolder];
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((left, right) => left.sort_order - right.sort_order);
}

function normalizeFolderName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`inline-block h-4 w-4 animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
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
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
