"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import LinkListItem from "@/components/link/LinkListItem";
import FilterChip from "@/components/ui/FilterChip";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import {
  recordRecentFolder,
  recordRecentLink,
  recordRecentSearch,
  useRecentFolders,
  useRecentLinks,
  useRecentSearches,
} from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import { LINK_OPEN_ERROR_MESSAGE, openLinkTarget } from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

const FOLDER_EMOJIS = ["📁", "💜", "🐱", "📌", "📝", "🎧", "🧸", "🎬", "🛋️", "📚"];

export default function SearchClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const { user } = useAuth();
  const { links, loading } = useLinks();
  const { folders } = useFolders();
  const { toast, showToast } = useToast();
  const recentSearches = useRecentSearches(user?.id ?? null);
  const recentLinkRecords = useRecentLinks(user?.id ?? null);
  const recentFolderRecords = useRecentFolders(user?.id ?? null);

  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  useEffect(() => {
    if (!hasQuery) {
      return;
    }

    recordRecentSearch(user?.id ?? null, debouncedQuery.trim());
  }, [debouncedQuery, hasQuery, user?.id]);

  const folderNameById = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder.name]));
  }, [folders]);

  const filteredFolders = useMemo(() => {
    if (!hasQuery) {
      return [] as Folder[];
    }

    return folders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery));
  }, [folders, hasQuery, normalizedQuery]);

  const filteredLinks = useMemo(() => {
    if (!hasQuery) {
      return [] as LinkType[];
    }

    return links.filter((link) => {
      const folderName = link.folder_id ? folderNameById.get(link.folder_id) : "";
      const searchableText = [
        link.url,
        link.custom_title,
        link.preview_title,
        link.preview_site_name,
        link.memo,
        folderName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [folderNameById, hasQuery, links, normalizedQuery]);

  const recentLinks = useMemo(() => {
    return recentLinkRecords
      .map((record) => links.find((link) => link.id === record.id) ?? record)
      .filter((record) => Boolean(record.url))
      .slice(0, 5);
  }, [links, recentLinkRecords]);

  const recentFolders = useMemo(() => {
    return recentFolderRecords
      .map((record) => {
        const currentFolder = folders.find((folder) => folder.id === record.id);
        return currentFolder ? { id: currentFolder.id, name: currentFolder.name } : record;
      })
      .slice(0, 3);
  }, [folders, recentFolderRecords]);

  function handleOpenLink(link: Partial<LinkType> & { id: string }) {
    recordRecentLink(user?.id ?? null, link);

    const openResult = openLinkTarget(link);

    if (openResult === "invalid") {
      showToast(LINK_OPEN_ERROR_MESSAGE);
    }
  }

  function handleOpenFolder(folder: Pick<Folder, "id" | "name">) {
    recordRecentFolder(user?.id ?? null, folder);
    router.push(`/links?folder=${folder.id}`);
  }

  return (
    <>
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center gap-2 rounded-[10px] bg-bg-subtle px-3.5 py-2.5">
            <span className="text-sm text-muted">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 메모, URL, 폴더명으로 찾기"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="text-subtle transition hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="검색어 지우기"
              >
                <ClearIcon />
              </button>
            ) : null}
          </div>
        </div>

        {hasQuery ? (
          <>
            {loading ? (
              <LoadingList />
            ) : filteredFolders.length === 0 && filteredLinks.length === 0 ? (
              <div className="px-5 py-10">
                <p className="text-sm font-medium text-body">검색 결과가 없어요</p>
                <p className="mt-1 text-[12px] text-muted">다른 검색어로 다시 찾아보세요.</p>
              </div>
            ) : (
              <>
                {filteredFolders.length > 0 ? (
                  <>
                    <div className="h-2 bg-bg-subtle" />
                    <SectionHeader label="폴더 결과" />
                    <div>
                      {filteredFolders.map((folder) => (
                        <FolderRow
                          key={folder.id}
                          folder={folder}
                          meta="폴더로 이동"
                          onClick={() => handleOpenFolder(folder)}
                        />
                      ))}
                    </div>
                  </>
                ) : null}

                {filteredLinks.length > 0 ? (
                  <>
                    <div className="h-2 bg-bg-subtle" />
                    <SectionHeader label="링크 결과" />
                    <div>
                      {filteredLinks.map((link) => (
                        <LinkListItem
                          key={link.id}
                          link={link}
                          onOpen={() => handleOpenLink(link)}
                          rightSlot={
                            <Link
                              href={`/links/${link.id}`}
                              aria-label="링크 상세 보기"
                              className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center text-subtle transition hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              <ArrowIcon />
                            </Link>
                          }
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            {recentSearches.length > 0 ? (
              <>
                <div className="h-2 bg-bg-subtle" />
                <SectionLabel>최근 검색어</SectionLabel>
                <div className="flex flex-wrap gap-1.5 px-5 pb-4">
                  {recentSearches.map((term) => (
                    <FilterChip key={term} onClick={() => setQuery(term)}>
                      {term}
                    </FilterChip>
                  ))}
                </div>
              </>
            ) : null}

            <div className="h-2 bg-bg-subtle" />
            <SectionHeader label="최근 링크" />
            {recentLinks.length > 0 ? (
              <div>
                {recentLinks.map((link) => (
                  <LinkListItem key={link.id} link={link} onOpen={() => handleOpenLink(link)} />
                ))}
              </div>
            ) : (
              <EmptySectionMessage
                title="최근에 연 링크가 없어요"
                description="링크를 열면 여기에서 빠르게 다시 볼 수 있어요."
              />
            )}

            <div className="h-2 bg-bg-subtle" />
            <SectionHeader label="최근 폴더" />
            {recentFolders.length > 0 ? (
              <div>
                {recentFolders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    meta="최근에 본 폴더"
                    onClick={() => handleOpenFolder(folder)}
                  />
                ))}
              </div>
            ) : (
              <EmptySectionMessage
                title="최근에 연 폴더가 없어요"
                description="폴더를 열면 여기에서 빠르게 다시 볼 수 있어요."
              />
            )}
          </>
        )}
      </div>

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 pt-4 pb-2 text-section-label uppercase text-muted">{children}</p>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <span className="text-section-label uppercase text-muted">{label}</span>
    </div>
  );
}

function FolderRow({
  folder,
  meta,
  onClick,
}: {
  folder: Pick<Folder, "id" | "name">;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center border-b border-border-row px-5 py-3 text-left last:border-0"
    >
      <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-bg-subtle text-base">
        {getFolderEmoji(folder)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{folder.name}</p>
        <p className="mt-0.5 text-[11px] text-subtle">{meta}</p>
      </div>
      <span className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center text-subtle">
        <ArrowIcon />
      </span>
    </button>
  );
}

function getFolderEmoji(folder: Pick<Folder, "id" | "name">) {
  const key = `${folder.id}:${folder.name}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % FOLDER_EMOJIS.length;
  }

  return FOLDER_EMOJIS[hash];
}

function LoadingList() {
  return (
    <div>
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-border-row px-5 py-3 last:border-0 animate-pulse"
        >
          <div className="h-9 w-9 rounded-icon bg-bg-subtle" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-3/4 rounded-full bg-bg-subtle" />
            <div className="mt-2 h-2.5 w-1/3 rounded-full bg-bg-subtle" />
          </div>
          <div className="h-4 w-4 rounded-full bg-bg-subtle" />
        </div>
      ))}
    </div>
  );
}

function EmptySectionMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-6">
      <p className="text-sm font-medium text-body">{title}</p>
      <p className="mt-1 text-[12px] text-muted">{description}</p>
    </div>
  );
}

function SearchIcon() {
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
    >
      <circle cx="11" cy="11" r="7.5" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
