"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl px-4 pt-4 pb-8 sm:pb-4",
          className
        )}
      >
        {title && (
          <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
