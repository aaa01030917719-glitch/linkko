"use client";

import { usePathname, useRouter } from "next/navigation";

function getHeaderConfig(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return {
      title: "링코",
      centered: false,
      showBack: false,
      showSearch: true,
    };
  }

  if (pathname.startsWith("/search")) {
    return {
      title: "검색",
      centered: true,
      showBack: false,
      showSearch: false,
    };
  }

  if (pathname.startsWith("/me")) {
    return {
      title: "마이",
      centered: true,
      showBack: false,
      showSearch: false,
    };
  }

  if (pathname.startsWith("/links")) {
    return {
      title: "링크",
      centered: true,
      showBack: false,
      showSearch: false,
    };
  }

  if (pathname.startsWith("/folders")) {
    return {
      title: "폴더",
      centered: true,
      showBack: true,
      showSearch: false,
    };
  }

  return {
    title: "링코",
    centered: true,
    showBack: true,
    showSearch: false,
  };
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { title, centered, showBack, showSearch } = getHeaderConfig(pathname);

  return (
    <header className="sticky top-0 z-20 bg-white">
      <div className="mx-auto flex h-[52px] max-w-2xl items-center px-5">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-1 mr-2 flex h-9 w-9 items-center justify-center rounded-icon text-ink transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:bg-bg-subtle"
            aria-label="뒤로 가기"
          >
            <BackIcon />
          </button>
        ) : centered ? (
          <div className="h-9 w-9 shrink-0" aria-hidden="true" />
        ) : null}

        <div className={`min-w-0 ${centered ? "flex-1 text-center" : "flex-1"}`}>
          <span className="text-base font-semibold text-ink">{title}</span>
        </div>

        {showSearch ? (
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-icon text-ink transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:bg-bg-subtle"
            aria-label="검색"
          >
            <SearchIcon />
          </button>
        ) : (
          <div className="h-9 w-9 shrink-0" aria-hidden="true" />
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
      strokeWidth="2.2"
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
      <circle cx="11" cy="11" r="7.5" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}
