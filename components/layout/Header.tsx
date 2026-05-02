"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const showBack = !pathname.startsWith("/dashboard");
  const showSearchButton = !pathname.startsWith("/search");

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="-ml-1.5 mr-1 rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="뒤로 가기"
            >
              <BackIcon />
            </button>
          ) : null}

          <span className="text-base font-bold tracking-tight text-gray-900">
            링코
          </span>
        </div>

        {showSearchButton ? (
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200"
            aria-label="검색 페이지로 이동"
          >
            <SearchIcon />
          </button>
        ) : (
          <div className="h-9 w-9" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}

function BackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
