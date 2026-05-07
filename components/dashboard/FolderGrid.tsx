"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import FavoriteStarButton from "@/components/ui/FavoriteStarButton";
import type { FolderWithCount } from "@/types";

interface FolderGridProps {
  favoriteFolderIds: Set<string>;
  folders: FolderWithCount[];
  onAddLink: (folderId: string) => void;
  onToggleFavorite: (folderId: string) => void;
}

const FOLDER_EMOJIS = ["📁", "🗂️", "🧺", "🪴", "🧾", "🎞️", "🧩", "🧠", "🛍️", "🧵"];

export default function FolderGrid({
  favoriteFolderIds,
  folders,
  onAddLink,
  onToggleFavorite,
}: FolderGridProps) {
  const router = useRouter();

  function openFolder(folderId: string) {
    router.push(`/links?folder=${folderId}`);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, folderId: string) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFolder(folderId);
    }
  }

  if (folders.length === 0) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm font-medium text-body">아직 폴더가 없어요.</p>
        <p className="mt-1 text-[12px] text-muted">새 폴더를 만들고 링크를 정리해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 pr-5 touch-pan-x">
      {folders.map((folder) => (
        <article key={folder.id} className="w-[220px] shrink-0 snap-start">
          <div
            role="link"
            tabIndex={0}
            onClick={() => openFolder(folder.id)}
            onKeyDown={(event) => handleCardKeyDown(event, folder.id)}
            aria-label={`${folder.name} 폴더 열기`}
            className="flex min-h-[144px] flex-col rounded-[24px] border border-[#E9E5DE] bg-[#FBF9F5] p-4 text-left shadow-[0_1px_0_rgba(17,17,17,0.03)] transition hover:border-[#D7D2C9] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white text-[22px] shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]">
                <span aria-hidden="true">{getFolderEmoji(folder)}</span>
              </div>

              <FavoriteStarButton
                active={favoriteFolderIds.has(folder.id)}
                label={`${folder.name} 폴더 즐겨찾기`}
                onClick={() => onToggleFavorite(folder.id)}
              />
            </div>

            <div className="mt-4 min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">{folder.name}</p>
              <p className="mt-1 text-[12px] text-muted">{folder.link_count}개 링크</p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-5">
              <span className="text-[11px] font-medium text-subtle">폴더 열기</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddLink(folder.id);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-[inset_0_0_0_1px_rgba(91,111,245,0.16)] transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:bg-brand-light"
                  aria-label={`${folder.name}에 링크 추가`}
                >
                  <PlusIcon />
                </button>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-subtle shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]">
                  <ArrowIcon />
                </span>
              </div>
            </div>
          </div>
        </article>
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

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
