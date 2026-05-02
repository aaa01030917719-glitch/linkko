"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/useToast";
import { signOutAndRedirect } from "@/lib/supabase/logout";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatarFallback, getUserDisplayName } from "@/lib/utils/user";

export default function MeClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: authLoading } = useAuth();
  const { links } = useLinks();
  const { folders } = useFolders();
  const { toast, showToast } = useToast();

  const [loggingOut, setLoggingOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(getUserDisplayName(user));
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    await signOutAndRedirect(router);
  }

  function openNameEditor() {
    setNameDraft(displayName ?? "");
    setNameError("");
    setEditOpen(true);
  }

  async function handleSaveName() {
    const trimmedName = nameDraft.trim();

    if (!trimmedName) {
      setNameError("이름을 입력해 주세요.");
      return;
    }

    setSavingName(true);
    setNameError("");

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user?.user_metadata ?? {}),
          name: trimmedName,
        },
      });

      if (error) {
        throw error;
      }

      setDisplayName(getUserDisplayName(data.user) ?? trimmedName);
      setEditOpen(false);
      showToast("이름을 저장했어요.");
    } catch {
      setNameError("이름을 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSavingName(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-5 pt-2">
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-gray-100" />
              <div className="h-3 w-48 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
          <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 pt-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100">
              <span className="text-2xl text-primary-700">
                {getUserAvatarFallback(user)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400">계정 정보</p>
                  <p className="mt-2 truncate text-sm text-gray-500">
                    {user?.email ?? "이메일 정보가 없어요."}
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-gray-900">
                    {displayName ?? "이름을 설정해 주세요"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNameEditor}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="저장한 링크" value={links.length} unit="개" />
          <StatCard label="만든 폴더" value={folders.length} unit="개" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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

      {editOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditOpen(false)}
          />

          <BottomSheetShell ariaLabel="이름 수정" onClose={() => setEditOpen(false)}>
            <div className="px-5 pt-3">
              <h2 className="mb-5 text-lg font-bold text-gray-900">이름 수정</h2>

              <div className="space-y-3">
                <input
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    setNameError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSaveName();
                    }
                  }}
                  placeholder="사용자 이름"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus-visible:outline-none"
                  autoFocus
                />

                {nameError ? (
                  <p className="pl-1 text-xs text-red-500">{nameError}</p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveName()}
                    disabled={savingName || !nameDraft.trim()}
                    className="flex-1 rounded-lg bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {savingName ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </>
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
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
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
      {sub ? <span className="text-xs text-gray-400">{sub}</span> : null}
    </div>
  );
}
