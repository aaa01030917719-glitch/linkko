"use client";

import { useState, useRef, useEffect } from "react";
import { isValidUrl } from "@/lib/utils/url";
import type { Folder, Link, LinkPreview } from "@/types";

interface AddLinkModalProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  onAdd: (payload: Partial<Link>) => Promise<void>;
}

type Step = "url" | "detail";

export default function AddLinkModal({ open, onClose, folders, onAdd }: AddLinkModalProps) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [folderId, setFolderId] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState("");

  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => urlInputRef.current?.focus(), 100);
    } else {
      // 닫힐 때 초기화
      setStep("url");
      setUrl(""); setCustomTitle(""); setMemo(""); setFolderId("");
      setPreview(null); setUrlError("");
    }
  }, [open]);

  async function handleUrlNext(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setUrlError("올바른 URL을 입력해주세요. (https://...)");
      return;
    }
    setUrlError("");
    setFetching(true);

    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data: LinkPreview = await res.json();
        setPreview(data);
        setCustomTitle(data.title ?? "");
      }
    } catch {
      // 미리보기 실패는 조용히 처리
    }

    setFetching(false);
    setStep("detail");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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

    setLoading(false);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8 pt-3">
          {step === "url" ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-5">링크 저장</h2>

              <form onSubmit={handleUrlNext} className="space-y-3">
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                      placeholder="https://..."
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm outline-none transition
                        ${urlError
                          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        }`}
                    />
                    {url && (
                      <button
                        type="button"
                        onClick={() => { setUrl(""); setUrlError(""); }}
                        className="text-gray-300 hover:text-gray-500 transition px-1"
                      >
                        <ClearIcon />
                      </button>
                    )}
                  </div>
                  {urlError && <p className="text-xs text-red-500 mt-1.5 pl-1">{urlError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={!url || fetching}
                  className="w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white hover:bg-primary-600 transition disabled:opacity-40 shadow-md shadow-primary-500/25"
                >
                  {fetching ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> 미리보기 불러오는 중...
                    </span>
                  ) : "다음"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 뒤로 + 제목 */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setStep("url")}
                  className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition"
                >
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-gray-900">상세 정보</h2>
              </div>

              {/* 미리보기 카드 */}
              {(preview?.image || preview?.title) && (
                <div className="flex gap-3 bg-gray-50 rounded-2xl p-3 mb-4 border border-gray-100">
                  {preview.image && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                      <img src={preview.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">
                      {preview.title}
                    </p>
                    {preview.site_name && (
                      <p className="text-xs text-gray-400 mt-1">{preview.site_name}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">제목</label>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="제목 (선택)"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">메모</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="기억하고 싶은 내용..."
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">폴더</label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition bg-white appearance-none"
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
                    {loading ? <Spinner className="mx-auto" /> : "저장"}
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

/* ── icons ── */

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`inline-block animate-spin w-4 h-4 ${className ?? ""}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
