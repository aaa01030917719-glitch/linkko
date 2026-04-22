interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message = "데이터를 불러오지 못했어요.",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-red-400 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <p className="text-sm text-red-600 truncate">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 transition underline underline-offset-2"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
