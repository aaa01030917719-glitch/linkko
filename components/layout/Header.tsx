"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOutAndRedirect } from "@/lib/supabase/logout";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const showBack = !pathname.startsWith("/dashboard");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await signOutAndRedirect(router);
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1.5 mr-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="뒤로 가기"
              type="button"
            >
              <BackIcon />
            </button>
          )}
          <span className="text-base font-bold text-gray-900 tracking-tight">
            링코
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          type="button"
          className="px-2 py-1 text-sm text-gray-400 transition hover:text-gray-600 disabled:opacity-50"
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
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
