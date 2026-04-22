import Link from "next/link";
import { extractDomain } from "@/lib/utils/url";
import { timeAgo } from "@/lib/utils/time";
import type { Link as LinkType } from "@/types";

interface RecentLinksProps {
  links: LinkType[];
  loading: boolean;
}

export default function RecentLinks({ links, loading }: RecentLinksProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">🔗</p>
        <p className="text-sm text-gray-400">저장된 링크가 없어요</p>
        <p className="text-xs text-gray-300 mt-1">아래 버튼으로 첫 링크를 저장해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {links.map((link) => {
        const title = link.custom_title || link.preview_title || extractDomain(link.url);
        return (
          <Link
            key={link.id}
            href={`/links/${link.id}`}
            className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 hover:bg-gray-50 active:bg-gray-100 transition shadow-sm"
          >
            {/* 썸네일 */}
            <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
              {link.preview_image ? (
                <img
                  src={link.preview_image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <LinkPlaceholderIcon />
                </div>
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{title}</p>
              <p className="text-xs text-gray-400">{extractDomain(link.url)}</p>
              <p className="text-xs text-gray-300">{timeAgo(link.created_at)}</p>
            </div>
          </Link>
        );
      })}

      {/* 전체 보기 */}
      <Link
        href="/links"
        className="block text-center text-sm text-primary-500 font-medium py-2 hover:underline"
      >
        전체 보기 →
      </Link>
    </div>
  );
}

function LinkPlaceholderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
