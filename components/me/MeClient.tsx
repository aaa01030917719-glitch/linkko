"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLinks } from "@/hooks/useLinks";
import { useFolders } from "@/hooks/useFolders";

export default function MeClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { links } = useLinks();
  const { folders } = useFolders();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5 pt-2">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-2xl">
              {user?.email?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "사용자"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="저장한 링크" value={links.length} unit="개" />
        <StatCard label="만든 폴더" value={folders.length} unit="개" />
      </div>

      {/* 메뉴 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <MenuItem label="앱 정보" sub="링코 v0.1.0" />
        <div className="h-px bg-gray-100" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition text-left"
        >
          <span className="text-sm font-medium text-red-500">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
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
