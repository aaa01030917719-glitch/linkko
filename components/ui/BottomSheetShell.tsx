"use client";

import { useEffect, useRef, useState } from "react";

interface BottomSheetShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
  onClose?: () => void;
}

export default function BottomSheetShell({
  children,
  className = "",
  contentClassName = "",
  ariaLabel = "Dialog",
  onClose,
}: BottomSheetShellProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const { visualViewport } = window;

    const updateKeyboardOffset = () => {
      const nextOffset = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop,
      );

      setKeyboardOffset(nextOffset);
    };

    updateKeyboardOffset();
    visualViewport.addEventListener("resize", updateKeyboardOffset);
    visualViewport.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      visualViewport.removeEventListener("resize", updateKeyboardOffset);
      visualViewport.removeEventListener("scroll", updateKeyboardOffset);
    };
  }, []);

  useEffect(() => {
    const currentSheet = sheetRef.current;

    if (!currentSheet) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target || typeof target.scrollIntoView !== "function") {
        return;
      }

      window.setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 120);
    };

    currentSheet.addEventListener("focusin", handleFocusIn);

    return () => {
      currentSheet.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  useEffect(() => {
    const currentSheet = sheetRef.current;

    if (!currentSheet) {
      return;
    }

    const timer = window.setTimeout(() => {
      currentSheet.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!onClose) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      style={{
        transform:
          keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        transition: "transform 180ms ease-out",
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`w-full overflow-hidden rounded-t-[28px] rounded-b-none bg-white shadow-2xl focus-visible:outline-none md:mx-auto md:max-w-2xl ${className}`}
        style={{ maxHeight: "78vh" }}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div
          className={`overflow-y-auto ${contentClassName}`}
          style={{
            maxHeight: "calc(78vh - 16px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
