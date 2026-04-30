"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/auth/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectUrl } from "@/lib/supabase/auth-redirect";

type FieldError = {
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
};

const SIGNUP_API_PATH = "/api/auth/dev-signup";

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [notice, setNotice] = useState("");

  function validate() {
    const next: FieldError = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      next.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      next.email = "올바른 이메일 형식을 입력해 주세요.";
    }

    if (!password) {
      next.password = "비밀번호를 입력해 주세요.";
    } else if (password.length < 6) {
      next.password = "비밀번호는 6자 이상이어야 해요.";
    }

    if (!confirm) {
      next.confirm = "비밀번호를 한 번 더 입력해 주세요.";
    } else if (password !== confirm) {
      next.confirm = "비밀번호가 서로 다르게 입력됐어요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const normalizedEmail = email.trim();

    setLoading(true);
    setErrors({});
    setNotice("");

    try {
      const signupResponse = await fetch(SIGNUP_API_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const signupResult = (await signupResponse.json().catch(() => null)) as
        | { error?: string; userId?: string | null }
        | null;

      console.log("[auth] devAutoSignup", {
        email: normalizedEmail,
        userId: signupResult?.userId ?? null,
        ok: signupResponse.ok,
        error: signupResult?.error ?? null,
      });

      if (!signupResponse.ok) {
        setErrors({
          general: signupResult?.error ?? "회원가입을 완료하지 못했어요.",
        });
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      console.log("[auth] signInAfterDevAutoSignup", {
        email: normalizedEmail,
        error: signInError
          ? {
              message: signInError.message,
              name: signInError.name,
              status: signInError.status,
              code: signInError.code,
            }
          : null,
      });

      if (signInError) {
        setErrors({ general: signInError.message });
        setLoading(false);
        return;
      }

      setNotice("가입이 완료됐어요. 바로 시작해볼게요.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "회원가입 처리 중 오류가 발생했습니다.";

      setErrors({ general: message });
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrors({});
    setNotice("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectUrl("/dashboard"),
      },
    });

    if (error) {
      setErrors({ general: translateOAuthError(error.message) });
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30">
          <LinkkoIcon />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            링코 시작하기
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            개발용 설정으로 가입 후 바로 사용할 수 있어요.
          </p>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
      >
        {googleLoading ? <Spinner className="text-gray-400" /> : <GoogleIcon />}
        Google로 계속하기
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">또는 이메일로</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSignup} noValidate className="space-y-3">
        <div className="space-y-1">
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="이메일"
            autoComplete="email"
            className={inputCls(Boolean(errors.email))}
          />
          {errors.email ? <FieldMsg>{errors.email}</FieldMsg> : null}
        </div>

        <div className="space-y-1">
          <PasswordInput
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                confirm: undefined,
              }));
            }}
            placeholder="비밀번호 (6자 이상)"
            autoComplete="new-password"
            className={inputCls(Boolean(errors.password))}
            toggleLabel="비밀번호"
          />
          {errors.password ? <FieldMsg>{errors.password}</FieldMsg> : null}
        </div>

        <div className="space-y-1">
          <PasswordInput
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            placeholder="비밀번호 확인"
            autoComplete="new-password"
            className={inputCls(Boolean(errors.confirm))}
            toggleLabel="비밀번호 확인"
          />
          {errors.confirm ? <FieldMsg>{errors.confirm}</FieldMsg> : null}
        </div>

        {errors.general ? <MessageBox tone="error">{errors.general}</MessageBox> : null}
        {notice ? <MessageBox tone="success">{notice}</MessageBox> : null}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-1 w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50"
        >
          {loading ? <Spinner className="mx-auto text-white" /> : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-500 transition hover:text-primary-600"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}

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
  return <p className="pl-1 text-xs text-red-500">{children}</p>;
}

function MessageBox({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "error" | "success";
}) {
  const styles =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-600"
      : "border-green-100 bg-green-50 text-green-700";

  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function translateOAuthError(message: string) {
  if (message.includes("provider is not enabled")) {
    return "Google 로그인이 아직 설정되지 않았어요.";
  }

  return "Google 로그인 중 문제가 생겼어요. 다시 시도해 주세요.";
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
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
