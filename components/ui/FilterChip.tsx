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
        "min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        active
          ? "border-primary-200 bg-primary-50 font-semibold text-primary-600"
          : "border-gray-200 bg-white font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 active:bg-gray-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
