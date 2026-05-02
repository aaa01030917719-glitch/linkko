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
        "shrink-0 whitespace-nowrap rounded-2xl border px-4 py-2 text-sm transition",
        active
          ? "border-gray-900 bg-gray-900 font-semibold text-white"
          : "border-gray-200 bg-white font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 active:bg-gray-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
