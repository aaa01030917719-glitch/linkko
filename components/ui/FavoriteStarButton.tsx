"use client";

interface FavoriteStarButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export default function FavoriteStarButton({
  active,
  label,
  onClick,
}: FavoriteStarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-icon p-1 transition active:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]/40 ${
        active
          ? "text-[#F5C518] hover:bg-[#F5C518]/12"
          : "text-[#F5C518]/45 hover:bg-[#F5C518]/10 hover:text-[#F5C518]/80"
      }`}
    >
      <StarIcon active={active} />
    </button>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2.8 14.95 8.78 21.55 9.74 16.77 14.39 17.9 20.95 12 17.85 6.1 20.95 7.23 14.39 2.45 9.74 9.05 8.78 12 2.8" />
    </svg>
  );
}
