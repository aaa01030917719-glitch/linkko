import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-md font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50",
        variant === "primary" && "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm shadow-primary-500/20",
        variant === "secondary" && "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        variant === "ghost" && "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-100",
        variant === "danger" && "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        className
      )}
    >
      {children}
    </button>
  );
}
