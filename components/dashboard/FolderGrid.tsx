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

const FOLDER_EMOJIS = ["📁", "💜", "🐱", "📌", "📝", "🎧", "🍀", "🌿", "📚", "🎞️"];

export default function FolderGrid({
  favoriteFolderIds,
  folders,
  onAddLink,
  onToggleFavorite,
}: FolderGridProps) {
  const router = useRouter();

  if (folders.length === 0) {
    return (
      <div className="py-8">
        <p className="text-sm font-semibold text-gray-500">아직 폴더가 없어요</p>
        <p className="mt-1 text-xs text-gray-400">
          오른쪽 위에서 새 폴더를 만들어 보세요
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {folders.map((folder) => (
        <div key={folder.id} className="flex min-h-12 items-center gap-1 py-1">
          <button
            type="button"
            onClick={() => router.push(`/links?folder=${folder.id}`)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-2 text-left transition hover:bg-gray-50 active:bg-gray-100"
          >
            <span aria-hidden="true" className="shrink-0 text-lg leading-none">
              {getFolderEmoji(folder)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-gray-900">
                {folder.name}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {folder.link_count > 0 ? `${folder.link_count}개` : "비어 있음"}
              </p>
            </div>
          </button>

          <FavoriteStarButton
            active={favoriteFolderIds.has(folder.id)}
            label={`${folder.name} 폴더 즐겨찾기`}
            onClick={() => onToggleFavorite(folder.id)}
          />

          <button
            type="button"
            onClick={() => onAddLink(folder.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-500 transition hover:bg-primary-50 active:bg-primary-100"
            aria-label={`${folder.name}에 링크 추가`}
          >
            <PlusIcon />
          </button>
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
