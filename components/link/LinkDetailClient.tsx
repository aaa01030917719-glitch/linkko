"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PreviewThumbnail from "@/components/link/PreviewThumbnail";
import { extractDomain } from "@/lib/utils/url";
import { useToast } from "@/hooks/useToast";
import EditLinkModal from "@/components/link/EditLinkModal";
import Toast from "@/components/ui/Toast";
import type { Folder, Link as LinkType } from "@/types";

interface Props {
  id: string;
}

export default function LinkDetailClient({ id }: Props) {
  const [link, setLink] = useState<LinkType | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast, showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: linkData }, { data: foldersData }] = await Promise.all([
        supabase.from("links").select("*").eq("id", id).single(),
        supabase.from("folders").select("*").order("sort_order"),
      ]);
      const folderList = (foldersData as Folder[]) ?? [];
      setFolders(folderList);
      if (linkData) {
        setLink(linkData as LinkType);
        if (linkData.folder_id) {
          const found = folderList.find((f) => f.id === linkData.folder_id);
          setFolder(found ?? null);
        }
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  async function handleSave(linkId: string, payload: Partial<LinkType>) {
    const { error } = await supabase.from("links").update(payload).eq("id", linkId);
    if (error) { showToast("수정에 실패했어요."); return; }
    setLink((prev) => (prev ? { ...prev, ...payload } : null));
    if ("folder_id" in payload) {
      setFolder(folders.find((f) => f.id === payload.folder_id) ?? null);
    }
    showToast("수정됐어요 ✓");
    setEditOpen(false);
  }

  async function handleDelete() {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) { showToast("삭제에 실패했어요."); return; }
    router.replace("/dashboard");
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 pt-2">
        <div className="flex justify-end mb-5">
          <div className="w-8 h-8 rounded-xl bg-gray-100" />
        </div>
        <div className="h-48 rounded-3xl bg-gray-100" />
        <div className="h-36 rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-400 mb-3">링크를 찾을 수 없어요.</p>
        <button onClick={() => router.back()} className="text-sm text-primary-500">
          돌아가기
        </button>
      </div>
    );
  }

  const title = link.custom_title || link.preview_title || extractDomain(link.url);
  const savedDate = new Date(link.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* ... 더보기 버튼 */}
      <div className="flex justify-end mb-4 pt-1">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            aria-label="더보기"
          >
            <DotsIcon />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-10">
              <button
                onClick={() => { setDropdownOpen(false); setEditOpen(true); }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-[#222] hover:bg-gray-50 transition"
              >
                수정
              </button>
              <div className="h-px bg-gray-100 mx-3" />
              <button
                onClick={() => { setDropdownOpen(false); setDeleteOpen(true); }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-[#FF4444] hover:bg-red-50 transition"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 메인 카드 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-3">
        <PreviewThumbnail
          image={link.preview_image}
          title={title}
          siteName={link.preview_site_name}
          url={link.url}
          className="w-full h-48"
        />
        <div className="p-5 space-y-3.5">
          <h1 className="text-lg font-bold text-gray-900 leading-snug">{title}</h1>
          <div className="flex items-center gap-2 min-w-0">
            {link.preview_site_name && (
              <>
                <span className="text-sm text-gray-600 shrink-0">{link.preview_site_name}</span>
                <span className="text-gray-300">·</span>
              </>
            )}
            <span className="text-xs text-gray-400 truncate">{extractDomain(link.url)}</span>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white hover:bg-primary-600 active:bg-primary-700 transition shadow-md shadow-primary-500/25"
          >
            <ExternalLinkIcon />
            원본 링크 열기
          </a>
        </div>
      </div>

      {/* 상세 정보 카드 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
        {link.memo && (
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-1.5 tracking-wide">메모</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{link.memo}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-1.5 tracking-wide">폴더</p>
          <p className="text-sm text-gray-600">{folder ? folder.name : "미분류"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-1.5 tracking-wide">저장 날짜</p>
          <p className="text-sm text-gray-600">{savedDate}</p>
        </div>
      </div>

      <EditLinkModal
        link={editOpen ? link : null}
        folders={folders}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      {deleteOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl p-6 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-gray-900 mb-2">링크를 삭제할까요?</h3>
            <p className="text-sm text-gray-400 mb-5">삭제한 링크는 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-2xl bg-[#FF4444] py-3 text-sm font-semibold text-white hover:bg-[#e03e3e] transition"
              >
                삭제
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} />}
    </>
  );
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
