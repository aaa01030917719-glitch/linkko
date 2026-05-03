"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FilterChipProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function FilterChip({
  active = false,
  children,
  className,
  onClick,
  type = "button",
}: FilterChipProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "min-h-[32px] shrink-0 whitespace-nowrap rounded-chip border px-3 py-1 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        active
          ? "border-brand bg-brand-light font-semibold text-brand"
          : "border-[#E8E8E8] bg-white font-medium text-body hover:border-border-card hover:text-ink active:bg-bg-subtle",
        className,
      )}
    >
      {children}
    </button>
  );
}
