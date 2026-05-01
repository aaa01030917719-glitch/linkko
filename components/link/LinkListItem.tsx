import Link from "next/link";
import { timeAgo } from "@/lib/utils/time";
import { extractDomain } from "@/lib/utils/url";
import type { Link as LinkType } from "@/types";

interface LinkListItemProps {
  link: LinkType;
  href: string;
  trailing?: React.ReactNode;
}

export default function LinkListItem({
  link,
  href,
  trailing,
}: LinkListItemProps) {
  const title = link.custom_title || link.preview_title || extractDomain(link.url);
  const domain = extractDomain(link.url);
  const platform = getPlatformType(link.url, link.preview_site_name);

  return (
    <div className="flex min-h-12 items-center gap-3 py-2">
      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-3 transition hover:bg-gray-50 active:bg-gray-100"
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
      </Link>

      <div className="shrink-0">{trailing ?? <ArrowIcon />}</div>
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
      className="text-gray-300"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
