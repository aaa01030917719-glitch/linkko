import Link from "next/link";
import LinkListItem from "@/components/link/LinkListItem";
import type { Link as LinkType } from "@/types";

interface RecentLinksProps {
  emptyDescription?: string;
  emptyTitle?: string;
  links: LinkType[];
  loading: boolean;
  onOpenLink?: (link: LinkType) => void;
  showViewAllButton?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function RecentLinks({
  emptyDescription = "아래 버튼으로 첫 링크를 저장해 보세요.",
  emptyTitle = "아직 저장한 링크가 없어요.",
  links,
  loading,
  onOpenLink,
  showViewAllButton = false,
  viewAllHref = "/links",
  viewAllLabel = "전체 링크 보기",
}: RecentLinksProps) {
  if (loading) {
    return (
      <div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3 px-5 py-3">
            <div className="h-9 w-9 rounded-icon bg-bg-subtle" />
            <div className="min-w-0 flex-1">
              <div className="h-3.5 w-3/4 rounded-full bg-bg-subtle" />
            </div>
            <div className="h-4 w-4 rounded-full bg-bg-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm font-medium text-body">{emptyTitle}</p>
        <p className="mt-1 text-[12px] text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        {links.map((link) => (
          <LinkListItem
            key={link.id}
            link={link}
            href={onOpenLink ? undefined : `/links/${link.id}`}
            onOpen={onOpenLink ? () => onOpenLink(link) : undefined}
            rightSlot={
              <Link
                href={`/links/${link.id}`}
                aria-label="링크 상세 보기"
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center text-subtle transition hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <ArrowIcon />
              </Link>
            }
          />
        ))}
      </div>

      {showViewAllButton ? (
        <div className="px-5 pb-4 pt-4">
          <Link
            href={viewAllHref}
            className="flex h-11 w-full items-center justify-center rounded-[10px] border border-[#E8E8E8] bg-white px-4 text-[13px] font-medium text-body transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {viewAllLabel}
          </Link>
        </div>
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
