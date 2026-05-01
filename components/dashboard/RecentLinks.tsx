import Link from "next/link";
import { timeAgo } from "@/lib/utils/time";
import { extractDomain } from "@/lib/utils/url";
import type { Link as LinkType } from "@/types";

interface RecentLinksProps {
  links: LinkType[];
  loading: boolean;
}

export default function RecentLinks({ links, loading }: RecentLinksProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="flex min-h-12 items-center gap-3 py-2 animate-pulse"
          >
            <div className="h-6 w-6 rounded-full bg-gray-100" />
            <div className="min-w-0 flex-1">
              <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
              <div className="mt-2 h-2.5 w-1/3 rounded-full bg-gray-100" />
            </div>
            <div className="h-4 w-4 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="py-8">
        <p className="text-sm font-semibold text-gray-500">
          아직 저장한 링크가 없어요.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          아래 버튼으로 첫 링크를 저장해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="divide-y divide-gray-100">
        {links.map((link) => {
          const title =
            link.custom_title || link.preview_title || extractDomain(link.url);
          const domain = extractDomain(link.url);
          const platform = getPlatformType(link.url, link.preview_site_name);

          return (
            <Link
              key={link.id}
              href={`/links/${link.id}`}
              className="flex min-h-12 items-center gap-3 py-2 transition hover:bg-gray-50 active:bg-gray-100"
            >
              <div className={getPlatformIconClassName(platform)}>
                <PlatformIcon type={platform} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-gray-900">
                  {title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="truncate">{domain}</span>
                  <span aria-hidden="true">&bull;</span>
                  <span>{timeAgo(link.created_at)}</span>
                </div>
              </div>

              <div className="shrink-0 text-gray-300">
                <ArrowIcon />
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/links"
        className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
      >
        전체 링크 보기
      </Link>
    </div>
  );
}

type PlatformType = "instagram" | "youtube" | "default";

function getPlatformType(url: string, siteName: string | null) {
  const target = `${url} ${siteName ?? ""}`.toLowerCase();

  if (target.includes("instagram")) {
    return "instagram";
  }

  if (target.includes("youtube") || target.includes("youtu.be")) {
    return "youtube";
  }

  return "default";
}

function getPlatformIconClassName(type: PlatformType) {
  if (type === "instagram") {
    return "flex h-6 w-6 shrink-0 items-center justify-center text-pink-500";
  }

  if (type === "youtube") {
    return "flex h-6 w-6 shrink-0 items-center justify-center text-red-500";
  }

  return "flex h-6 w-6 shrink-0 items-center justify-center text-gray-400";
}

function PlatformIcon({ type }: { type: PlatformType }) {
  if (type === "instagram") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "youtube") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.5.5a3 3 0 0 0-2.1 2.1C2 8.9 2 12 2 12s0 3.1.4 4.8a3 3 0 0 0 2.1 2.1c1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5a3 3 0 0 0 2.1-2.1c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 7h3a5 5 0 0 1 0 10h-3" />
      <path d="M9 17H6A5 5 0 1 1 6 7h3" />
      <path d="M8 12h8" />
    </svg>
  );
}

function ArrowIcon() {
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
