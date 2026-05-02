"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { openLinkTarget } from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

const FOLDER_EMOJIS = ["📁", "💜", "🐱", "📌", "📝", "🌿", "🎧", "🧠", "📚", "✨"];

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

    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(normalizedQuery),
    );
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
        return currentFolder
          ? { id: currentFolder.id, name: currentFolder.name }
          : record;
      })
      .slice(0, 3);
  }, [folders, recentFolderRecords]);

  function handleOpenLink(link: Partial<LinkType> & { id: string }) {
    recordRecentLink(user?.id ?? null, link);

    const openResult = openLinkTarget(link.url ?? "");

    if (openResult === "invalid") {
      showToast("열 수 없는 링크예요.");
    }
  }

  function handleOpenFolder(folder: Pick<Folder, "id" | "name">) {
    recordRecentFolder(user?.id ?? null, folder);
    router.push(`/links?folder=${folder.id}`);
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <header className="pt-2">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">검색</h2>

          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 메모, URL, 폴더명으로 찾기"
              className="w-full rounded-2xl bg-gray-100 py-3.5 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 transition hover:text-gray-600"
                aria-label="검색어 지우기"
              >
                <ClearIcon />
              </button>
            ) : null}
          </div>
        </header>

        {recentSearches.length > 0 ? (
          <section>
            <h3 className="mb-3 text-[13px] font-medium text-gray-600">최근 검색어</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {recentSearches.map((term) => (
                <FilterChip key={term} onClick={() => setQuery(term)}>
                  {term}
                </FilterChip>
              ))}
            </div>
          </section>
        ) : null}

        {hasQuery ? (
          <section className="space-y-5">
            <p className="text-xs text-gray-400">
              {loading
                ? "검색 중..."
                : `폴더 ${filteredFolders.length}개 · 링크 ${filteredLinks.length}개`}
            </p>

            {loading ? (
              <LoadingList />
            ) : filteredFolders.length === 0 && filteredLinks.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-semibold text-gray-700">검색 결과가 없어요</p>
                <p className="mt-1 text-xs text-gray-400">
                  다른 검색어로 다시 찾아보세요.
                </p>
              </div>
            ) : (
              <>
                {filteredFolders.length > 0 ? (
                  <section>
                    <h3 className="mb-3 text-[13px] font-medium text-gray-600">
                      폴더 결과
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {filteredFolders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => handleOpenFolder(folder)}
                          className="flex min-h-12 w-full items-center gap-2.5 py-2 text-left transition hover:bg-gray-50 active:bg-gray-100"
                        >
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-lg leading-none"
                          >
                            {getFolderEmoji(folder)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-gray-900">
                              {folder.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              폴더로 이동
                            </p>
                          </div>
                          <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-gray-300">
                            <ArrowIcon />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {filteredLinks.length > 0 ? (
                  <section>
                    <h3 className="mb-3 text-[13px] font-medium text-gray-600">
                      링크 결과
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {filteredLinks.map((link) => (
                        <LinkListItem
                          key={link.id}
                          link={link}
                          onOpen={() => handleOpenLink(link)}
                          rightSlot={
                            <Link
                              href={`/links/${link.id}`}
                              aria-label="링크 상세 보기"
                              className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-200"
                            >
                              <ArrowIcon />
                            </Link>
                          }
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </section>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-gray-600">최근 링크</h3>
              </div>

              {recentLinks.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentLinks.map((link) => (
                    <LinkListItem
                      key={link.id}
                      link={link}
                      onOpen={() => handleOpenLink(link)}
                    />
                  ))}
                </div>
              ) : (
                <EmptySectionMessage
                  title="최근에 연 링크가 없어요"
                  description="링크를 열면 여기에서 다시 빠르게 볼 수 있어요."
                />
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-gray-600">최근 폴더</h3>
              </div>

              {recentFolders.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleOpenFolder(folder)}
                      className="flex min-h-12 w-full items-center gap-2.5 py-2 text-left transition hover:bg-gray-50 active:bg-gray-100"
                    >
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg leading-none"
                      >
                        {getFolderEmoji(folder)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-gray-900">
                          {folder.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          최근 본 폴더
                        </p>
                      </div>
                      <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-gray-300">
                        <ArrowIcon />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptySectionMessage
                  title="최근에 연 폴더가 없어요"
                  description="폴더를 열면 여기에서 다시 빠르게 볼 수 있어요."
                />
              )}
            </section>
          </>
        )}
      </div>

      {toast ? <Toast message={toast} /> : null}
    </>
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
    <div className="space-y-1">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="flex min-h-12 items-center gap-3 py-2 animate-pulse"
        >
          <div className="h-6 w-6 rounded-full bg-gray-100" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
            <div className="mt-2 h-2.5 w-1/3 rounded-full bg-gray-100" />
          </div>
          <div className="h-4 w-4 rounded-full bg-gray-100" />
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
    <div className="py-8">
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
