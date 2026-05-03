"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "홈",
    activeOn: ["/dashboard"],
    icon: HomeIcon,
  },
  {
    href: "/links",
    label: "링크",
    activeOn: ["/links"],
    icon: LinkIcon,
  },
  {
    href: "/search",
    label: "검색",
    activeOn: ["/search"],
    icon: SearchIcon,
  },
  {
    href: "/me",
    label: "마이",
    activeOn: ["/me"],
    icon: UserIcon,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border-row bg-white">
      <div className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map(({ href, label, activeOn, icon: Icon }) => {
          const active = activeOn.some((value) => pathname.startsWith(value));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 pt-2 pb-3.5 text-[10px] font-medium transition",
                active ? "text-brand" : "text-subtle",
              )}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="leading-none"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1V9.5Z" />
    </svg>
  );
}

function LinkIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-brand" : "text-subtle"}
    >
      <path d="M10 13a5 5 0 0 0 7.1.5l2.9-2.9a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.1-.5L4 13.4a5 5 0 0 0 7.1 7.1l1.7-1.7" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-brand" : "text-subtle"}
    >
      <circle cx="11" cy="11" r="7.5" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="leading-none"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
