"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "홈",
    activeOn: ["/dashboard"],
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "#6C5CE7" : "none"}
        stroke={active ? "#6C5CE7" : "#AAAAAA"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline
          points="9 22 9 12 15 12 15 22"
          stroke={active ? "#6C5CE7" : "#AAAAAA"}
          fill="none"
        />
      </svg>
    ),
  },
  {
    href: "/links",
    label: "링크",
    activeOn: ["/links"],
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#6C5CE7" : "#AAAAAA"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "나",
    activeOn: ["/me"],
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "#6C5CE7" : "none"}
        stroke={active ? "#6C5CE7" : "#AAAAAA"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map(({ href, label, activeOn, icon }) => {
          const active = activeOn.some((path) => pathname.startsWith(path));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition",
                active ? "text-primary-500" : "text-gray-400",
              )}
            >
              {icon(active)}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
