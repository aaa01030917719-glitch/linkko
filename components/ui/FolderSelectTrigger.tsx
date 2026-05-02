"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FolderSelectTriggerProps {
  value: string;
  onClick: () => void;
  className?: string;
  muted?: boolean;
  tone?: "neutral" | "selected";
  leadingIcon?: ReactNode;
}

export default function FolderSelectTrigger({
  value,
  onClick,
  className,
  muted = false,
  tone = "neutral",
  leadingIcon,
}: FolderSelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        tone === "selected"
          ? "border-primary-200 bg-primary-50 text-primary-700"
          : "border-gray-200 bg-white text-gray-900 hover:border-primary-200 hover:bg-primary-50/40",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {leadingIcon ? (
          <span className="shrink-0 text-gray-400" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className={cn("truncate", muted && "text-gray-500")}>{value}</span>
      </span>

      <ChevronDownIcon />
    </button>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
