"use client";

interface AuthLoadingScreenProps {
  message: string;
}

export default function AuthLoadingScreen({
  message,
}: AuthLoadingScreenProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
          <Spinner />
        </div>
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
