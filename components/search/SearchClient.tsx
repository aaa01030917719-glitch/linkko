"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { useFolders } from "@/hooks/useFolders";
import { useToast } from "@/hooks/useToast";
import SearchResultCard from "@/components/search/SearchResultCard";
import EditLinkModal from "@/components/link/EditLinkModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import type { Link } from "@/types";

type FolderFilter = string | null | undefined;

export default function SearchClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<FolderFilter>(undefined);
  const [results, setResults] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { folders } = useFolders();
  const { toast, showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const isActive = debouncedQuery.trim() !== "" || folderFilter !== undefined;
    if (!isActive) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    async function search() {
      setLoading(true);
      setHasSearched(true);

      let q = supabase.from("links").select("*").order("created_at", { ascending: false });

      if (debouncedQuery.trim()) {
        const term = debouncedQuery.trim();
        q = q.or(
          `url.ilike.%${term}%,custom_title.ilike.%${term}%,preview_title.ilike.%${term}%,memo.ilike.%${term}%`
        );
      }

      if (folderFilter === null) {
        q = q.is("folder_id", null);
      } else if (typeof folderFilter === "string") {
        q = q.eq("folder_id", folderFilter);
      }

      const { data } = await q;
      setResults(data ?? []);
      setLoading(false);
    }

    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, folderFilter]);

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    try {
      await supabase.from("links").delete().eq("id", pendingDeleteId);
      setResults((prev) => prev.filter((l) => l.id !== pendingDeleteId));
      showToast("삭제됐어요");
    } catch {
      showToast("삭제에 실패했어요.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleUpdate(id: string, payload: Partial<Link>) {
    try {
      await supabase.from("links").update(payload).eq("id", id);
      setResults((prev) => prev.map((l) => (l.id === id ? { ...l, ...payload } : l)));
      showToast("수정됐어요");
    } catch {
      showToast("수정에 실패했어요.");
    }
  }

  const isEmpty = hasSearched && !loading && results.length === 0;
  const showResults = hasSearched && !loading && results.length > 0;

  return (
    <>
      <div className="space-y-5 pb-10">
        <header className="pt-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">검색</h2>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목이나 메모로 찾기"
              className="w-full bg-gray-100 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </header>

        {/* 폴더 탭 */}
        <div className="flex overflow-x-auto -mx-4 px-4 border-b border-gray-100 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setFolderFilter(undefined)}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm border-b-2 transition -mb-px",
              folderFilter === undefined
                ? "border-primary-500 text-primary-500 font-bold"
                : "border-transparent text-gray-300 font-medium hover:text-gray-500"
            )}
          >
            전체
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setFolderFilter(folder.id)}
              className={cn(
                "shrink-0 px-4 py-2.5 text-sm border-b-2 transition -mb-px",
                folderFilter === folder.id
                  ? "border-primary-500 text-primary-500 font-bold"
                  : "border-transparent text-gray-300 font-medium hover:text-gray-500"
              )}
            >
              {folder.name}
            </button>
          ))}
        </div>

        {/* 로딩 skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 animate-pulse">
                <div className="w-[60px] h-[60px] rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-full w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 검색 결과 */}
        {showResults && (
          <section className="space-y-2.5">
            <p className="text-xs text-gray-400">
              {results.length}개 결과
              {folderFilter !== undefined && (
                <span className="ml-1 text-gray-300">
                  · {folders.find((f) => f.id === folderFilter)?.name}
                </span>
              )}
            </p>
            {results.map((link) => (
              <SearchResultCard
                key={link.id}
                link={link}
                query={query.trim()}
                folders={folders}
                onEdit={setEditingLink}
                onDelete={setPendingDeleteId}
              />
            ))}
          </section>
        )}

        {/* 빈 상태 */}
        {isEmpty && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <EmptySearchIcon />
            </div>
            <p className="text-sm font-semibold text-gray-700">검색 결과가 없어요</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              다른 키워드로 검색하거나
              <br />
              폴더 태그를 바꿔보세요
            </p>
          </div>
        )}

        {/* 초기 안내 */}
        {!hasSearched && !loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-gray-400">
              저장한 링크 제목, 메모, URL로
              <br />
              검색할 수 있어요
            </p>
          </div>
        )}
      </div>

      <EditLinkModal
        link={editingLink}
        folders={folders}
        onClose={() => setEditingLink(null)}
        onSave={handleUpdate}
      />
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="링크 삭제"
        message="이 링크를 삭제하면 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      {toast && <Toast message={toast} />}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EmptySearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}
