"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FolderList from "@/components/folder/FolderList";
import AddLinkFab from "@/components/link/AddLinkFab";
import AddLinkModal from "@/components/link/AddLinkModal";
import EditLinkModal from "@/components/link/EditLinkModal";
import LinkListItem from "@/components/link/LinkListItem";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import { extractDomain } from "@/lib/utils/url";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { usePendingSharedLink } from "@/hooks/usePendingSharedLink";
import { useToast } from "@/hooks/useToast";
import type { Link } from "@/types";

export default function LinksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folder") ?? undefined;
  const querySharedText = searchParams.get("sharedText");
  const querySharedUrl = searchParams.get("sharedUrl");

  const [selectedFolder, setSelectedFolder] = useState<
    string | null | undefined
  >(initialFolder ?? undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [actionLink, setActionLink] = useState<Link | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const { clearPendingSharedLink, sharedText, sharedUrl } = usePendingSharedLink({
    text: querySharedText,
    url: querySharedUrl,
  });

  const {
    folders,
    error: foldersError,
    createFolder,
    refetch: refetchFolders,
  } = useFolders();
  const {
    links,
    loading,
    error: linksError,
    addLink,
    updateLink,
    deleteLink,
    refetch: refetchLinks,
  } = useLinks(selectedFolder);

  const filteredLinks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return links;
    }

    return links.filter((link) => {
      const searchableText = [
        link.custom_title,
        link.preview_title,
        link.memo,
        link.url,
        extractDomain(link.url),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [links, searchQuery]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    setAddOpen(true);
  }, [sharedText, sharedUrl]);

  async function handleAdd(payload: Partial<Link>) {
    try {
      await addLink(payload);
      clearSharedEntry();
      showToast("링크가 저장됐어요.");
      setAddOpen(false);
    } catch {
      showToast("링크를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleUpdate(id: string, payload: Partial<Link>) {
    try {
      await updateLink(id, payload);
      showToast("수정됐어요.");
    } catch {
      showToast("수정하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    try {
      await deleteLink(pendingDeleteId);
      showToast("삭제됐어요.");
    } catch {
      showToast("삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  function clearSharedEntry() {
    clearPendingSharedLink();

    if (
      !searchParams.has("shared") &&
      !searchParams.has("sharedText") &&
      !searchParams.has("sharedUrl") &&
      !searchParams.has("t")
    ) {
      return;
    }

    const nextSearchParams = new URLSearchParams();

    if (typeof selectedFolder === "string" && selectedFolder) {
      nextSearchParams.set("folder", selectedFolder);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/links?${nextQuery}` : "/links", {
      scroll: false,
    });
  }

  function handleOpenAddLink() {
    clearSharedEntry();
    setAddOpen(true);
  }

  function handleCloseAddLink() {
    clearSharedEntry();
    setAddOpen(false);
  }

  const currentFolderName =
    selectedFolder === null
      ? "미분류"
      : selectedFolder
        ? folders.find((folder) => folder.id === selectedFolder)?.name
        : undefined;

  return (
    <>
      <div className="space-y-4 pb-36">
        <header className="pt-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentFolderName ?? "링크"}
          </h2>

          <div className="relative mt-4">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="제목, 메모, URL로 찾기"
              className="w-full rounded-2xl bg-gray-100 py-3.5 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-200"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                aria-label="검색어 지우기"
              >
                <ClearIcon />
              </button>
            ) : null}
          </div>
        </header>

        {(foldersError || linksError) && (
          <ErrorBanner
            message={linksError ?? foldersError ?? "데이터를 불러오지 못했어요."}
            onRetry={() => {
              refetchLinks();
              refetchFolders();
            }}
          />
        )}

        <FolderList
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
        />

        {loading ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, index) => (
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
        ) : filteredLinks.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-gray-500">
              {searchQuery.trim()
                ? "검색 결과가 없어요."
                : selectedFolder === null
                  ? "미분류 링크가 아직 없어요."
                  : "저장한 링크가 아직 없어요."}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery.trim()
                ? "다른 검색어로 다시 찾아보세요."
                : "아래 버튼으로 새 링크를 저장해 보세요."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLinks.map((link) => (
              <LinkListItem
                key={link.id}
                link={link}
                href={`/links/${link.id}`}
                trailing={
                  <button
                    type="button"
                    onClick={() => setActionLink(link)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-100"
                    aria-label="링크 옵션 열기"
                  >
                    <DotsIcon />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      <AddLinkFab onClick={handleOpenAddLink} />

      <AddLinkModal
        open={addOpen}
        onClose={handleCloseAddLink}
        folders={folders}
        initialFolderId={selectedFolder}
        initialSharedText={sharedText}
        initialUrl={sharedUrl}
        onAdd={handleAdd}
        onCreateFolder={createFolder}
      />

      <EditLinkModal
        link={editingLink}
        folders={folders}
        onClose={() => setEditingLink(null)}
        onSave={handleUpdate}
      />

      {actionLink ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActionLink(null)}
          />
          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-lg font-bold text-gray-900">
                {actionLink.custom_title ||
                  actionLink.preview_title ||
                  extractDomain(actionLink.url)}
              </h2>
              <p className="mb-5 text-sm text-gray-400">
                링크에서 필요한 작업을 선택해 주세요.
              </p>

              <div className="space-y-2">
                <ActionButton
                  label="상세 보기"
                  onClick={() => {
                    router.push(`/links/${actionLink.id}`);
                    setActionLink(null);
                  }}
                />
                <ActionButton
                  label="수정"
                  onClick={() => {
                    setEditingLink(actionLink);
                    setActionLink(null);
                  }}
                />
                <ActionButton
                  label="삭제"
                  tone="danger"
                  onClick={() => {
                    setPendingDeleteId(actionLink.id);
                    setActionLink(null);
                  }}
                />
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="링크를 삭제할까요?"
        message="이 링크를 삭제하면 다시 되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function ActionButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        tone === "danger"
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span>{label}</span>
      <ChevronIcon />
    </button>
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

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function ChevronIcon() {
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
