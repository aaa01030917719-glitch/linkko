"use client";

import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  toggleLabel?: string;
};

export default function PasswordInput({
  className = "",
  toggleLabel = "비밀번호",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const nextLabel = showPassword
    ? `${toggleLabel} 숨기기`
    : `${toggleLabel} 보기`;

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={[className, "pr-12"].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        aria-label={nextLabel}
        aria-pressed={showPassword}
        className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 transition hover:text-gray-600 active:text-gray-700"
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4 4" />
      <path d="M9.9 5.1A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4 4.9" />
      <path d="M6.6 6.7A17.8 17.8 0 0 0 2 12s3.5 7 10 7a11.7 11.7 0 0 0 5-.9" />
    </svg>
  );
}
