"use client";

import { useEffect, useRef, useState } from "react";
import PreviewThumbnail from "@/components/link/PreviewThumbnail";
import { isValidUrl } from "@/lib/utils/url";
import type { Folder, Link, LinkPreview } from "@/types";

interface AddLinkModalProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  onAdd: (payload: Partial<Link>) => Promise<void>;
  onCreateFolder: (name: string) => Promise<Folder>;
}

type Step = "url" | "detail";

export default function AddLinkModal({
  open,
  onClose,
  folders,
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
  const [showFolderComposer, setShowFolderComposer] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [urlError, setUrlError] = useState("");
  const [folderError, setFolderError] = useState("");

  const urlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvailableFolders(folders);
  }, [folders]);

  useEffect(() => {
    if (!open) {
      resetModal();
      return;
    }

    setTimeout(() => {
      urlInputRef.current?.focus();
    }, 100);
  }, [open]);

  useEffect(() => {
    if (!showFolderComposer) {
      return;
    }

    setTimeout(() => {
      folderInputRef.current?.focus();
    }, 50);
  }, [showFolderComposer]);

  function resetModal() {
    setStep("url");
    setUrl("");
    setCustomTitle("");
    setMemo("");
    setFolderId("");
    setPreview(null);
    setAvailableFolders(folders);
    setFetchingPreview(false);
    setSavingLink(false);
    setCreatingFolder(false);
    setShowFolderComposer(false);
    setNewFolderName("");
    setUrlError("");
    setFolderError("");
  }

  async function handlePreviewFetch(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidUrl(url)) {
      setUrlError("올바른 URL을 입력해 주세요. (https://...)");
      return;
    }

    setUrlError("");
    setFetchingPreview(true);

    try {
      const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        setPreview(null);
      } else {
        const data: LinkPreview = await response.json();
        setPreview(data);
        setCustomTitle(data.title ?? "");
      }
    } catch {
      setPreview(null);
    } finally {
      setFetchingPreview(false);
      setStep("detail");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingLink(true);

    try {
      await onAdd({
        url,
        custom_title: customTitle || null,
        memo: memo || null,
        folder_id: folderId || null,
        preview_title: preview?.title ?? null,
        preview_description: preview?.description ?? null,
        preview_image: preview?.image ?? null,
        preview_site_name: preview?.site_name ?? null,
      });
    } finally {
      setSavingLink(false);
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      setFolderError("폴더 이름을 입력해 주세요.");
      return;
    }

    setCreatingFolder(true);
    setFolderError("");

    try {
      const createdFolder = await onCreateFolder(trimmedName);

      setAvailableFolders((currentFolders) =>
        sortFolders(upsertFolder(currentFolders, createdFolder))
      );
      setFolderId(createdFolder.id);
      setNewFolderName("");
      setShowFolderComposer(false);
    } catch {
      setFolderError("폴더를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setCreatingFolder(false);
    }
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

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8 pt-3">
          {step === "url" ? (
            <>
              <h2 className="mb-5 text-lg font-bold text-gray-900">링크 저장</h2>

              <form onSubmit={handlePreviewFetch} className="space-y-3">
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setUrlError("");
                      }}
                      placeholder="https://..."
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                        urlError
                          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      }`}
                    />
                    {url && (
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
                    )}
                  </div>
                  {urlError && (
                    <p className="mt-1.5 pl-1 text-xs text-red-500">{urlError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!url || fetchingPreview}
                  className="w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-40 shadow-md shadow-primary-500/25"
                >
                  {fetchingPreview ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner />
                      미리보기를 불러오는 중...
                    </span>
                  ) : (
                    "다음"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("url")}
                  className="p-1 -ml-1 text-gray-400 transition hover:text-gray-600"
                >
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-gray-900">상세 정보</h2>
              </div>

              {(preview?.image || preview?.title) && (
                <div className="mb-4 flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <PreviewThumbnail
                    image={preview.image}
                    title={preview.title ?? "링크 미리보기"}
                    siteName={preview.site_name}
                    url={url}
                    className="h-14 w-14 rounded-xl"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-800">
                      {preview.title}
                    </p>
                    {preview.site_name && (
                      <p className="mt-1 text-xs text-gray-400">{preview.site_name}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                    제목
                  </label>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="제목 (선택)"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                    메모
                  </label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="기억하고 싶은 내용을 적어 보세요."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block pl-1 text-xs font-semibold text-gray-500">
                    폴더
                  </label>

                  <div className="flex items-center gap-2">
                    <select
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      className="min-w-0 flex-1 appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">미분류</option>
                      {sortFolders(availableFolders).map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFolderComposer((current) => !current);
                        setFolderError("");
                      }}
                      className="shrink-0 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3.5 text-sm font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100"
                    >
                      추가
                    </button>
                  </div>

                  {showFolderComposer && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <form onSubmit={handleCreateFolder} className="flex gap-2">
                        <input
                          ref={folderInputRef}
                          value={newFolderName}
                          onChange={(e) => {
                            setNewFolderName(e.target.value);
                            setFolderError("");
                          }}
                          placeholder="새 폴더 이름"
                          className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                        <button
                          type="submit"
                          disabled={creatingFolder}
                          className="rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                        >
                          {creatingFolder ? "생성 중" : "추가"}
                        </button>
                      </form>
                      {folderError && (
                        <p className="mt-2 pl-1 text-xs text-red-500">{folderError}</p>
                      )}
                    </div>
                  )}
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
                    disabled={savingLink}
                    className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 shadow-md shadow-primary-500/25"
                  >
                    {savingLink ? <Spinner className="mx-auto" /> : "저장"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function upsertFolder(folders: Folder[], nextFolder: Folder) {
  const withoutExisting = folders.filter((folder) => folder.id !== nextFolder.id);
  return [...withoutExisting, nextFolder];
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((left, right) => left.sort_order - right.sort_order);
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
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
