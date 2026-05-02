import Link from "next/link";
import LinkListItem from "@/components/link/LinkListItem";
import type { Link as LinkType } from "@/types";

interface RecentLinksProps {
  emptyDescription?: string;
  emptyTitle?: string;
  links: LinkType[];
  loading: boolean;
  showViewAllButton?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function RecentLinks({
  emptyDescription = "아래 버튼으로 첫 링크를 저장해 보세요",
  emptyTitle = "아직 저장한 링크가 없어요",
  links,
  loading,
  showViewAllButton = false,
  viewAllHref = "/links",
  viewAllLabel = "전체 링크 보기",
}: RecentLinksProps) {
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
        <p className="text-sm font-semibold text-gray-500">{emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="divide-y divide-gray-100">
        {links.map((link) => (
          <LinkListItem
            key={link.id}
            link={link}
            href={`/links/${link.id}`}
            rightSlot={
              <Link
                href={`/links/${link.id}`}
                aria-label="링크 상세 보기"
                className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-200"
              >
                <ArrowIcon />
              </Link>
            }
          />
        ))}
      </div>

      {showViewAllButton ? (
        <Link
          href={viewAllHref}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
        >
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
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
