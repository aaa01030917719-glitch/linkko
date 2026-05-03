"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/useToast";
import { signOutAndRedirect } from "@/lib/supabase/logout";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatarFallback, getUserDisplayName } from "@/lib/utils/user";

const QUICK_ACTIONS = [
  { label: "태그 관리", icon: "🏷️", bg: "#FFF3E8" },
  { label: "내보내기", icon: "📤", bg: "#EEF0FE" },
  { label: "알림 설정", icon: "🔔", bg: "#FFF6DE" },
  { label: "개인정보", icon: "🔒", bg: "#F2F7EC" },
];

export default function MeClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: authLoading } = useAuth();
  const { links } = useLinks();
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
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="animate-pulse px-5 pt-5">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-avatar bg-bg-subtle" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded-full bg-bg-subtle" />
              <div className="h-3 w-40 rounded-full bg-bg-subtle" />
            </div>
          </div>
          <div className="mt-[18px] h-[88px] rounded-stat border border-border-card bg-white" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="flex items-center gap-3.5 px-5 pt-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-avatar bg-brand text-2xl text-white">
            {getUserAvatarFallback(user)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="truncate text-[18px] font-bold tracking-tight text-ink">
                {displayName ?? "이름을 설정해 주세요"}
              </span>
              <button
                type="button"
                onClick={openNameEditor}
                className="text-[13px] text-muted transition hover:text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="이름 수정"
              >
                ✏
              </button>
            </div>
            <p className="truncate text-[12px] text-muted">{user?.email ?? "이메일 정보가 없어요."}</p>
          </div>
        </div>

        <div className="mx-5 mt-[18px] rounded-stat border border-border-card bg-white p-4">
          <p className="mb-1 text-[11px] font-medium text-ink">저장한 링크</p>
          <p className="text-2xl font-bold tracking-tight text-brand">{links.length}개</p>
        </div>

        <section className="mt-7">
          <SectionLabel>계정 정보</SectionLabel>
          <InfoRow
            label="이름"
            value={displayName ?? "이름을 설정해 주세요"}
            action={
              <button
                type="button"
                onClick={openNameEditor}
                className="text-[12px] font-semibold text-brand transition hover:opacity-80"
              >
                수정
              </button>
            }
          />
          <InfoRow label="이메일" value={user?.email ?? "-"} />
        </section>

        <section className="mt-7">
          <MenuRow
            icon="🔗"
            iconTint="bg-brand-light"
            title="자동 저장"
            sub="공유하면 바로 링코에 저장"
            onClick={() => showToast("앱에서 사용할 수 있어요.")}
          />
        </section>

        <section className="mt-7">
          <SectionLabel>더 보기</SectionLabel>
          <div className="grid grid-cols-2 gap-y-1">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => showToast("준비 중이에요.")}
                className="flex items-center gap-2.5 px-5 py-3.5 text-left"
              >
                <div
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-icon text-[17px]"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <span className="text-[13px] font-medium text-ink">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <MenuRow title="공지사항" onClick={() => showToast("준비 중이에요.")} />
          <MenuRow title="고객센터" onClick={() => showToast("준비 중이에요.")} />
        </section>

        <div className="mt-6 flex items-center px-5 py-3.5">
          <p className="text-[12px] text-muted">앱 정보 · 링코 v0.1.0</p>
        </div>

        <div className="px-5 py-3.5">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            type="button"
            className="text-sm font-medium text-danger transition hover:opacity-80 disabled:opacity-50"
          >
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </div>

      {editOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setEditOpen(false)} />

          <BottomSheetShell ariaLabel="이름 수정" onClose={() => setEditOpen(false)}>
            <div className="px-5 pt-3">
              <h2 className="mb-5 text-lg font-semibold text-ink">이름 수정</h2>

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
                  className="w-full rounded-[10px] border border-border-card px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
                  autoFocus
                />

                {nameError ? <p className="pl-1 text-xs text-danger">{nameError}</p> : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="flex-1 rounded-md border border-border-card bg-white py-3 text-sm font-semibold text-body transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveName()}
                    disabled={savingName || !nameDraft.trim()}
                    className="flex-1 rounded-md bg-brand py-3 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
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

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="px-5 pb-3 text-section-label uppercase text-muted">{children}</p>;
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center px-5 py-3.5">
      <span className="w-[72px] shrink-0 text-[13px] text-muted">{label}</span>
      <span className="flex-1 text-[13px] font-medium text-ink">{value}</span>
      {action}
    </div>
  );
}

function MenuRow({
  title,
  sub,
  icon,
  iconTint = "bg-bg-subtle",
  onClick,
}: {
  title: string;
  sub?: string;
  icon?: string;
  iconTint?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center px-5 py-3.5 text-left">
      {icon ? (
        <div
          className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-icon text-base ${iconTint}`}
        >
          {icon}
        </div>
      ) : null}
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {sub ? <p className="mt-0.5 text-[11px] text-muted">{sub}</p> : null}
      </div>
      <span className="text-[14px] text-subtle">›</span>
    </button>
  );
}
