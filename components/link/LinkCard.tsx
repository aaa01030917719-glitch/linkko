"use client";

import PreviewThumbnail from "@/components/link/PreviewThumbnail";
import { extractDomain } from "@/lib/utils/url";
import { timeAgo } from "@/lib/utils/time";
import type { Link } from "@/types";

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

export default function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  const title = link.custom_title || link.preview_title || extractDomain(link.url);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition"
      >
        {/* 썸네일 */}
        <PreviewThumbnail
          image={link.preview_image}
          title={title}
          siteName={link.preview_site_name}
          url={link.url}
          className="w-16 h-16 rounded-xl"
        />

        {/* 텍스트 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{title}</p>
          <p className="text-xs text-gray-400">{extractDomain(link.url)}</p>
          <p className="text-xs text-gray-300">{timeAgo(link.created_at)}</p>
        </div>
      </a>

      {/* 메모 */}
      {link.memo && (
        <div className="mx-3 mb-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2">{link.memo}</p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={() => onEdit(link)}
          className="flex-1 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
        >
          <PencilIcon />
          수정
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={() => onDelete(link.id)}
          className="flex-1 py-2.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1.5"
        >
          <TrashIcon />
          삭제
        </button>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
