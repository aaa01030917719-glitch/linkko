"use client";

import { useRouter } from "next/navigation";
import FavoriteStarButton from "@/components/ui/FavoriteStarButton";
import type { FolderWithCount } from "@/types";

interface FolderGridProps {
  favoriteFolderIds: Set<string>;
  folders: FolderWithCount[];
  onAddLink: (folderId: string) => void;
  onToggleFavorite: (folderId: string) => void;
}

const FOLDER_EMOJIS = ["📁", "💜", "🐱", "📌", "📝", "🎧", "🧸", "🎬", "🛋️", "📚"];

export default function FolderGrid({
  favoriteFolderIds,
  folders,
  onAddLink,
  onToggleFavorite,
}: FolderGridProps) {
  const router = useRouter();

  if (folders.length === 0) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm font-medium text-body">아직 폴더가 없어요</p>
        <p className="mt-1 text-[12px] text-muted">새 폴더를 만들어 링크를 정리해 보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {folders.map((folder) => (
        <div key={folder.id} className="flex items-center px-5 py-2.5">
          <button
            type="button"
            onClick={() => router.push(`/links?folder=${folder.id}`)}
            className="flex min-w-0 flex-1 items-center text-left"
          >
            <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-bg-subtle text-base">
              {getFolderEmoji(folder)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{folder.name}</p>
              <p className="mt-0.5 text-[11px] text-subtle">{folder.link_count}개</p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <FavoriteStarButton
              active={favoriteFolderIds.has(folder.id)}
              label={`${folder.name} 폴더 즐겨찾기`}
              onClick={() => onToggleFavorite(folder.id)}
            />

            <button
              type="button"
              onClick={() => onAddLink(folder.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-icon p-1 text-brand transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:bg-brand-light"
              aria-label={`${folder.name}에 링크 추가`}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getFolderEmoji(folder: FolderWithCount) {
  const key = `${folder.id}:${folder.name}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % FOLDER_EMOJIS.length;
  }

  return FOLDER_EMOJIS[hash];
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
