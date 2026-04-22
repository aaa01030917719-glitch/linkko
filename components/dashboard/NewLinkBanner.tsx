import Link from "next/link";

interface NewLinkBannerProps {
  count: number;
}

export default function NewLinkBanner({ count }: NewLinkBannerProps) {
  return (
    <Link
      href="/links"
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition"
    >
      {/* 보라 점 */}
      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />

      <span className="flex-1 text-sm font-medium text-gray-700">새로 저장한 링크</span>

      {/* 보라 뱃지 */}
      <span className="bg-primary-50 text-primary-500 text-xs font-bold px-2.5 py-1 rounded-full">
        {count}개
      </span>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#AAAAAA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
