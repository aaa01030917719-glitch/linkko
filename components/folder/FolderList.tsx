"use client";

import FilterChip from "@/components/ui/FilterChip";
import type { Folder } from "@/types";

interface FolderListProps {
  folders: Folder[];
  selectedId: string | null | undefined;
  onSelect: (id: string | null | undefined) => void;
}

export default function FolderList({
  folders,
  selectedId,
  onSelect,
}: FolderListProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <FilterChip active={selectedId === undefined} onClick={() => onSelect(undefined)}>
        전체
      </FilterChip>
      <FilterChip active={selectedId === null} onClick={() => onSelect(null)}>
        미분류
      </FilterChip>
      {folders.map((folder) => (
        <FilterChip
          key={folder.id}
          active={selectedId === folder.id}
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
        </FilterChip>
      ))}
    </div>
  );
}
