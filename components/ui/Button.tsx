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
        "inline-flex items-center justify-center font-semibold rounded-2xl transition disabled:opacity-50 active:scale-[0.98]",
        variant === "primary" && "bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20",
        variant === "secondary" && "bg-gray-100 text-gray-700 hover:bg-gray-200",
        variant === "ghost" && "text-gray-500 hover:bg-gray-100",
        variant === "danger" && "bg-red-50 text-red-500 hover:bg-red-100",
        size === "sm" && "text-xs px-3 py-2",
        size === "md" && "text-sm px-4 py-3",
        size === "lg" && "text-base px-5 py-3.5",
        className
      )}
    >
      {children}
    </button>
  );
}
