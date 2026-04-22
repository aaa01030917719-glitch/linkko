"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FieldError = { email?: string; password?: string; general?: string };

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  const supabase = createClient();

  function validate(): boolean {
    const next: FieldError = {};
    if (!email) next.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "올바른 이메일 형식이 아니에요.";
    if (!password) next.password = "비밀번호를 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrors({ general: translateError(error.message) });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setErrors({ general: translateError(error.message) });
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      {/* 로고 */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <LinkkoIcon />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">링코</h1>
          <p className="text-sm text-gray-500 mt-0.5">나만의 링크 아카이브</p>
        </div>
      </div>

      {/* 구글 로그인 */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-50 shadow-sm"
      >
        {googleLoading ? (
          <Spinner className="text-gray-400" />
        ) : (
          <GoogleIcon />
        )}
        구글로 계속하기
      </button>

      {/* 구분선 */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">또는 이메일로</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 이메일 폼 */}
      <form onSubmit={handleEmailLogin} noValidate className="space-y-3">
        <div className="space-y-1">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="이메일"
            autoComplete="email"
            className={inputCls(!!errors.email)}
          />
          {errors.email && <FieldMsg>{errors.email}</FieldMsg>}
        </div>

        <div className="space-y-1">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
            placeholder="비밀번호"
            autoComplete="current-password"
            className={inputCls(!!errors.password)}
          />
          {errors.password && <FieldMsg>{errors.password}</FieldMsg>}
        </div>

        {errors.general && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-500">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white hover:bg-primary-600 active:bg-primary-700 transition disabled:opacity-50 shadow-md shadow-primary-500/25 mt-1"
        >
          {loading ? <Spinner className="mx-auto text-white" /> : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary-500 hover:text-primary-600 transition"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}

/* ── helpers ── */

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400",
    "outline-none transition",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
  ].join(" ");
}

function FieldMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-red-500 pl-1">{children}</p>;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin w-4 h-4 ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (msg.includes("Email not confirmed")) return "이메일 인증이 필요해요. 메일함을 확인해주세요.";
  if (msg.includes("Too many requests")) return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  return "로그인 중 오류가 발생했어요. 다시 시도해주세요.";
}

function LinkkoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M8 14h12M14 8l6 6-6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
