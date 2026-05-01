"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLinks } from "@/hooks/useLinks";
import { useFolders } from "@/hooks/useFolders";
import { signOutAndRedirect } from "@/lib/supabase/logout";

export default function MeClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { links } = useLinks();
  const { folders } = useFolders();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await signOutAndRedirect(router);
  }

  if (authLoading) {
    return (
      <div className="space-y-5 pt-2">
        <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-gray-100" />
              <div className="h-3 w-48 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
          <div className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100">
            <span className="text-2xl">
              {user?.email?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-base font-bold text-gray-900">
              {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "사용자"}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="저장한 링크" value={links.length} unit="개" />
        <StatCard label="만든 폴더" value={folders.length} unit="개" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <MenuItem label="앱 정보" sub="링코 v0.1.0" />
        <div className="h-px bg-gray-100" />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
        >
          <span className="text-sm font-medium text-red-500">
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </span>
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="ml-1 text-sm font-medium text-gray-400">{unit}</span>
      </p>
    </div>
  );
}

function MenuItem({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}
