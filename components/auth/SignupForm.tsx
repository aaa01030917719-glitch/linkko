"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getEmailConfirmationRedirectUrl,
  getOAuthRedirectUrl,
} from "@/lib/supabase/auth-redirect";

type Step = "form" | "done";
type FieldError = {
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
};

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [notice, setNotice] = useState("");

  function validate() {
    const next: FieldError = {};

    if (!email) {
      next.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setNotice("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getEmailConfirmationRedirectUrl("/dashboard"),
      },
    });

    if (error) {
      setErrors({ general: translateSignupError(error.message) });
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStep("done");
    setNotice("인증 메일을 보냈어요. 메일함에서 인증 링크를 눌러주세요.");
    setLoading(false);
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

  async function handleResendConfirmation() {
    if (!email) {
      setErrors({ email: "인증 메일을 받을 이메일을 먼저 입력해 주세요." });
      return;
    }

    setResendLoading(true);
    setErrors((prev) => ({ ...prev, general: undefined }));
    setNotice("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getEmailConfirmationRedirectUrl("/dashboard"),
      },
    });

    if (error) {
      setErrors({ general: translateResendError(error.message) });
      setResendLoading(false);
      return;
    }

    setNotice("인증 메일을 다시 보냈어요. 받은편지함과 스팸함을 함께 확인해 주세요.");
    setResendLoading(false);
  }

  if (step === "done") {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckIcon />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          메일 확인이 필요해요
        </h2>
        <p className="text-sm leading-relaxed text-gray-500">
          <span className="font-medium text-gray-800">{email}</span>
          로 인증 메일을 보냈어요.
          <br />
          메일함에서 인증 링크를 누른 뒤 다시 돌아와 주세요.
        </p>

        {notice ? (
          <MessageBox tone="success" className="mt-5">
            {notice}
          </MessageBox>
        ) : null}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left text-sm text-gray-600 shadow-sm">
          <p className="font-semibold text-gray-900">메일이 안 보이나요?</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>스팸함이나 프로모션함도 함께 확인해 주세요.</li>
            <li>조금 전 요청했다면 1분 정도 기다린 뒤 다시 시도해 주세요.</li>
            <li>이미 가입한 이메일이라면 로그인 페이지에서 바로 로그인해 주세요.</li>
          </ul>
        </div>

        {errors.general ? (
          <MessageBox tone="error" className="mt-4">
            {errors.general}
          </MessageBox>
        ) : null}

        <button
          type="button"
          onClick={handleResendConfirmation}
          disabled={resendLoading}
          className="mt-6 w-full rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {resendLoading ? (
            <Spinner className="mx-auto text-gray-400" />
          ) : (
            "인증 메일 다시 보내기"
          )}
        </button>

        <Link
          href="/login"
          className="mt-3 inline-block w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 shadow-md shadow-primary-500/25"
        >
          로그인하러 가기
        </Link>
      </div>
    );
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
            무료로 가입하고 링크를 차곡차곡 정리해 보세요.
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
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
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
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                confirm: undefined,
              }));
            }}
            placeholder="비밀번호 (6자 이상)"
            autoComplete="new-password"
            className={inputCls(!!errors.password)}
          />
          {errors.password && <FieldMsg>{errors.password}</FieldMsg>}
        </div>

        <div className="space-y-1">
          <input
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            placeholder="비밀번호 확인"
            autoComplete="new-password"
            className={inputCls(!!errors.confirm)}
          />
          {errors.confirm && <FieldMsg>{errors.confirm}</FieldMsg>}
        </div>

        {errors.general ? <MessageBox tone="error">{errors.general}</MessageBox> : null}
        {notice ? <MessageBox tone="success">{notice}</MessageBox> : null}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-1 w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 shadow-md shadow-primary-500/25"
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
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: "error" | "success";
}) {
  const styles =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-600"
      : "border-green-100 bg-green-50 text-green-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles} ${className}`}>
      {children}
    </div>
  );
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

function translateSignupError(message: string) {
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일이에요. 로그인하거나 인증 메일을 다시 받아 주세요.";
  }

  if (message.includes("Email address not authorized")) {
    return "현재 메일 발송 설정으로는 이 주소에 인증 메일을 보낼 수 없어요. 관리자에게 문의해 주세요.";
  }

  if (message.includes("Password should be")) {
    return "비밀번호는 6자 이상이어야 해요.";
  }

  if (message.includes("Too many requests")) {
    return "요청이 잠시 많았어요. 잠깐 뒤에 다시 시도해 주세요.";
  }

  return "회원가입 중 문제가 생겼어요. 다시 시도해 주세요.";
}

function translateResendError(message: string) {
  if (message.includes("Email address not authorized")) {
    return "현재 메일 발송 설정으로는 이 주소에 인증 메일을 보낼 수 없어요. 관리자에게 문의해 주세요.";
  }

  if (message.includes("Too many requests") || message.includes("security purposes")) {
    return "방금 메일을 보냈다면 1분 정도 뒤에 다시 시도해 주세요.";
  }

  return "인증 메일을 다시 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
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

function CheckIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
