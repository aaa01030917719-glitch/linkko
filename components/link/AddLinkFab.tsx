"use client";

import { useEffect, useState } from "react";

interface AddLinkFabProps {
  onClick: () => void;
}

const TOOLTIP_STORAGE_KEY = "linkko.add-link-fab-tooltip-shown";

export default function AddLinkFab({ onClick }: AddLinkFabProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(TOOLTIP_STORAGE_KEY) === "true") {
      return;
    }

    setShowTooltip(true);

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
      setShowTooltip(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, []);

  function dismissTooltip() {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
    setShowTooltip(false);
  }

  return (
    <div
      className="fixed z-30"
      style={{
        right: "20px",
        bottom: "calc(80px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative">
        {showTooltip ? (
          <button
            type="button"
            onClick={dismissTooltip}
            className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-2xl bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
          >
            링크 저장
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            dismissTooltip();
            onClick();
          }}
          aria-label="링크 저장"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-xl shadow-primary-500/35 transition hover:bg-primary-600 active:scale-[0.98] active:bg-primary-700"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
