"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/auth/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import {
  getEmailConfirmationRedirectUrl,
  getOAuthRedirectUrl,
} from "@/lib/supabase/auth-redirect";

type FieldError = {
  email?: string;
  password?: string;
  general?: string;
};

const REMEMBERED_EMAIL_KEY = "linkko.remembered-email";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(
    searchParams.get("error") === "email_confirmation_failed",
  );
  const [errors, setErrors] = useState<FieldError>({});
  const [notice, setNotice] = useState("");
  const emailRedirectTo = getEmailConfirmationRedirectUrl("/dashboard");

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);

    if (!savedEmail) {
      return;
    }

    setEmail(savedEmail);
    setRememberEmail(true);
  }, []);

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
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function saveRememberedEmail(nextEmail: string) {
    const normalizedEmail = nextEmail.trim();

    if (!normalizedEmail) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      return;
    }

    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
  }

  function removeRememberedEmail() {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }

  function handleRememberEmailChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const checked = event.target.checked;
    setRememberEmail(checked);

    if (!checked) {
      removeRememberedEmail();
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const normalizedEmail = email.trim();

    if (rememberEmail) {
      saveRememberedEmail(normalizedEmail);
    } else {
      removeRememberedEmail();
    }

    setLoading(true);
    setErrors({});
    setNotice("");

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const requiresConfirmation = messageNeedsConfirmation(error.message);
      setNeedsEmailConfirmation(requiresConfirmation);
      setErrors({ general: translateLoginError(error.message) });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrors({ email: "인증 메일을 받을 이메일을 먼저 입력해 주세요." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrors({ email: "올바른 이메일 형식을 입력해 주세요." });
      return;
    }

    setResendLoading(true);
    setErrors((prev) => ({ ...prev, general: undefined }));
    setNotice("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo,
      },
    });

    logAuthResponse("resendSignupConfirmation", {
      email: normalizedEmail,
      emailRedirectTo,
      error,
    });

    if (error) {
      setErrors({
        general: formatVisibleAuthError(
          translateResendError(error.message),
          error.message,
        ),
      });
      setResendLoading(false);
      return;
    }

    setNeedsEmailConfirmation(true);
    setNotice(
      "인증 메일을 다시 보냈어요. 받은편지함과 스팸함을 함께 확인해 주세요.",
    );
    setResendLoading(false);
  }

  const systemMessage = getSystemMessage(searchParams.get("error"));

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 shadow-sm shadow-primary-500/20">
          <LinkkoIcon />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            링코
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">나만의 링크 아카이브</p>
        </div>
      </div>

      {systemMessage ? (
        <MessageBox tone={systemMessage.tone} className="mb-4">
          {systemMessage.message}
        </MessageBox>
      ) : null}

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:bg-gray-100 disabled:opacity-50"
      >
        {googleLoading ? <Spinner className="text-gray-400" /> : <GoogleIcon />}
        Google로 계속하기
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">또는 이메일로</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleEmailLogin} noValidate className="space-y-3">
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
            className={inputCls(!!errors.email)}
          />
          {errors.email && <FieldMsg>{errors.email}</FieldMsg>}
        </div>

        <label className="flex items-center gap-2 pl-1 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={handleRememberEmailChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
          />
          아이디 저장
        </label>

        <div className="space-y-1">
          <PasswordInput
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="비밀번호"
            autoComplete="current-password"
            className={inputCls(!!errors.password)}
            toggleLabel="비밀번호"
          />
          {errors.password && <FieldMsg>{errors.password}</FieldMsg>}
        </div>

        {errors.general ? <MessageBox tone="error">{errors.general}</MessageBox> : null}
        {notice ? <MessageBox tone="success">{notice}</MessageBox> : null}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-1 w-full rounded-lg bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:bg-primary-700 disabled:opacity-50"
        >
          {loading ? <Spinner className="mx-auto text-white" /> : "로그인"}
        </button>
      </form>

      {needsEmailConfirmation ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">인증 메일이 필요해요</p>
          <p className="mt-1">
            이메일 인증이 끝나지 않으면 로그인할 수 없어요. 받은편지함과 스팸함을
            먼저 확인해 주세요.
          </p>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading}
            className="mt-3 w-full rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {resendLoading ? (
              <Spinner className="mx-auto text-gray-400" />
            ) : (
              "인증 메일 다시 보내기"
            )}
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary-500 transition hover:text-primary-600"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-lg border bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400",
    "outline-none transition focus-visible:outline-none",
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
  tone: "error" | "info" | "success";
}) {
  const styles =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-600"
      : tone === "success"
        ? "border-green-100 bg-green-50 text-green-700"
        : "border-primary-100 bg-primary-50 text-primary-700";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles} ${className}`}>
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

type AuthLikeError = Error & {
  code?: string;
  status?: number;
};

function formatVisibleAuthError(
  friendlyMessage: string,
  technicalMessage?: string,
) {
  if (!technicalMessage || technicalMessage === friendlyMessage) {
    return friendlyMessage;
  }

  return `${friendlyMessage} (${technicalMessage})`;
}

function logAuthResponse(
  action: string,
  {
    email,
    emailRedirectTo,
    error,
  }: {
    email: string;
    emailRedirectTo: string;
    error: AuthLikeError | null;
  },
) {
  console.log(`[auth] ${action}`, {
    email,
    emailRedirectTo,
    error: error
      ? {
          message: error.message,
          name: error.name,
          status: error.status,
          code: error.code,
        }
      : null,
  });
}

function getSystemMessage(errorCode: string | null) {
  if (errorCode === "email_confirmation_failed") {
    return {
      tone: "info" as const,
      message:
        "인증 링크가 만료됐거나 이미 사용됐어요. 이메일을 입력한 뒤 인증 메일을 다시 보내 주세요.",
    };
  }

  if (errorCode === "auth_callback_failed") {
    return {
      tone: "error" as const,
      message: "로그인을 마무리하지 못했어요. 다시 시도해 주세요.",
    };
  }

  return null;
}

function messageNeedsConfirmation(message: string) {
  return message.includes("Email not confirmed");
}

function translateLoginError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요.";
  }

  if (message.includes("Email not confirmed")) {
    return "이메일 인증이 아직 끝나지 않았어요. 인증 메일을 확인해 주세요.";
  }

  if (message.includes("Too many requests")) {
    return "요청이 잠시 많았어요. 잠깐 뒤에 다시 시도해 주세요.";
  }

  return "로그인 중 문제가 생겼어요. 다시 시도해 주세요.";
}

function translateResendError(message: string) {
  if (message.includes("Email address not authorized")) {
    return "현재 메일 발송 설정으로는 이 주소에 인증 메일을 보낼 수 없어요. 관리자에게 문의해 주세요.";
  }

  if (
    message.includes("Too many requests") ||
    message.includes("security purposes")
  ) {
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
