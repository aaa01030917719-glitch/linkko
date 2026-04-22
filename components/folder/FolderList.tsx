"use client";

import { cn } from "@/lib/utils/cn";
import type { Folder } from "@/types";

interface FolderListProps {
  folders: Folder[];
  selectedId: string | null | undefined; // undefined = 전체, null = 미분류
  onSelect: (id: string | null | undefined) => void;
}

export default function FolderList({ folders, selectedId, onSelect }: FolderListProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <Chip label="전체" active={selectedId === undefined} onClick={() => onSelect(undefined)} />
      <Chip label="미분류" active={selectedId === null} onClick={() => onSelect(null)} />
      {folders.map((folder) => (
        <Chip
          key={folder.id}
          label={folder.name}
          active={selectedId === folder.id}
          onClick={() => onSelect(folder.id)}
        />
      ))}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      )}
    >
      {label}
    </button>
  );
}
