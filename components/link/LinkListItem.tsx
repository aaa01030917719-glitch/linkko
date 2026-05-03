import Link from "next/link";
import type { ReactNode } from "react";
import { timeAgo } from "@/lib/utils/time";
import { extractDomain, getLinkTargetValue } from "@/lib/utils/url";
import type { Link as LinkType } from "@/types";

interface LinkListItemProps {
  link: Partial<LinkType> & { id: string };
  href?: string;
  onOpen?: () => void;
  rightSlot?: ReactNode;
}

type PlatformType = "instagram" | "youtube" | "default";

export default function LinkListItem({
  link,
  href,
  onOpen,
  rightSlot,
}: LinkListItemProps) {
  const url = getLinkTargetValue(link);
  const domain = url ? extractDomain(url) : link.preview_site_name?.trim() || "링크";
  const fallbackTitle = domain || "링크";
  const title = link.custom_title?.trim() || link.preview_title?.trim() || fallbackTitle;
  const platform = getPlatformType(url, link.preview_site_name ?? null);
  const savedTime = link.created_at ? timeAgo(link.created_at) : null;
  const metaText = savedTime ? `${domain} · ${savedTime}` : domain;
  const content = (
    <>
      <div className={getPlatformIconClassName(platform)}>
        <PlatformIcon type={platform} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-subtle">{metaText}</p>
      </div>
    </>
  );

  const mainClassName =
    "flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none";

  return (
    <div className="flex items-center gap-1 border-b border-border-row px-5 py-3 last:border-0">
      {href ? (
        <Link href={href} className={mainClassName}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className={mainClassName} disabled={!onOpen}>
          {content}
        </button>
      )}

      {rightSlot}
    </div>
  );
}

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
    return "flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-[#FFF1F6] text-pink-500";
  }

  if (type === "youtube") {
    return "flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-[#FFF3F1] text-red-500";
  }

  return "flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-bg-subtle text-muted";
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
