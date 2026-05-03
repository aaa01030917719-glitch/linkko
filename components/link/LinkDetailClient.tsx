"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EditLinkModal from "@/components/link/EditLinkModal";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FolderSelectSheet from "@/components/ui/FolderSelectSheet";
import FolderSelectTrigger from "@/components/ui/FolderSelectTrigger";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { recordRecentLink } from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import {
  extractDomain,
  getLinkTargetValue,
  LINK_OPEN_ERROR_MESSAGE,
  openLinkTarget,
} from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

interface Props {
  id: string;
}

const UNCATEGORIZED_LABEL = "미분류";
const UNCATEGORIZED_VALUE = "__uncategorized__";

export default function LinkDetailClient({ id }: Props) {
  const [link, setLink] = useState<LinkType | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [moveLoading, setMoveLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const { favoriteIds, toggleFavorite } = useFavoriteIds("links", user?.id ?? null);
  const supabase = useMemo(() => createClient(), []);

  const sortedFolders = useMemo(
    () => [...folders].sort((left, right) => left.sort_order - right.sort_order),
    [folders],
  );

  useEffect(() => {
    async function load() {
      const [{ data: linkData }, { data: foldersData }] = await Promise.all([
        supabase.from("links").select("*").eq("id", id).single(),
        supabase.from("folders").select("*").order("sort_order"),
      ]);

      const folderList = (foldersData as Folder[]) ?? [];
      setFolders(folderList);

      if (linkData) {
        const nextLink = linkData as LinkType;
        setLink(nextLink);

        if (nextLink.folder_id) {
          const foundFolder = folderList.find((nextFolder) => nextFolder.id === nextLink.folder_id);
          setFolder(foundFolder ?? null);
          setMoveFolderId(nextLink.folder_id);
        } else {
          setFolder(null);
          setMoveFolderId("");
        }
      }

      setLoading(false);
    }

    void load();
  }, [id, supabase]);

  async function handleSave(linkId: string, payload: Partial<LinkType>) {
    const { error } = await supabase.from("links").update(payload).eq("id", linkId);

    if (error) {
      showToast("링크를 수정하지 못했어요. 다시 시도해 주세요.");
      throw error;
    }

    setLink((currentLink) => (currentLink ? { ...currentLink, ...payload } : null));

    if ("folder_id" in payload) {
      setFolder(folders.find((nextFolder) => nextFolder.id === payload.folder_id) ?? null);
      setMoveFolderId(payload.folder_id ?? "");
    }

    showToast("링크를 수정했어요.");
  }

  async function handleMoveLink(nextFolderId?: string | null) {
    if (!link) {
      return;
    }

    setMoveLoading(true);

    try {
      const resolvedFolderId = nextFolderId === undefined ? moveFolderId || null : nextFolderId;
      const { error } = await supabase
        .from("links")
        .update({ folder_id: resolvedFolderId })
        .eq("id", link.id);

      if (error) {
        throw error;
      }

      setLink((currentLink) =>
        currentLink ? { ...currentLink, folder_id: resolvedFolderId } : null,
      );
      setFolder(folders.find((nextFolder) => nextFolder.id === resolvedFolderId) ?? null);
      setMoveFolderId(resolvedFolderId ?? "");
      setMoveOpen(false);
      setMovePickerOpen(false);
      showToast(
        resolvedFolderId
          ? `${folders.find((nextFolder) => nextFolder.id === resolvedFolderId)?.name ?? "폴더"}로 옮겼어요`
          : "미분류로 옮겼어요",
      );
    } catch {
      showToast("폴더를 옮기지 못했어요. 다시 시도해 주세요.");
    } finally {
      setMoveLoading(false);
    }
  }

  async function handleDelete() {
    if (!link) {
      return;
    }

    const nextFolderId = link.folder_id;
    const { error } = await supabase.from("links").delete().eq("id", id);

    if (error) {
      showToast("링크를 삭제하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    if (nextFolderId) {
      router.replace(`/links?folder=${nextFolderId}`);
      return;
    }

    router.replace("/links");
  }

  function handleOpenLink() {
    if (!link) {
      return;
    }

    recordRecentLink(user?.id ?? null, link);
    const openResult = openLinkTarget(link);

    if (openResult === "invalid") {
      showToast(LINK_OPEN_ERROR_MESSAGE);
    }
  }

  if (loading) {
    return (
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="animate-pulse space-y-4 px-5 py-5">
          <div className="h-3 w-20 rounded-full bg-gray-100" />
          <div className="flex items-start justify-between gap-3">
            <div className="h-6 w-40 rounded-full bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-100" />
              <div className="h-8 w-8 rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="h-4 w-48 rounded-full bg-gray-100" />
          <div className="h-2 bg-bg-subtle -mx-5" />
          <div className="h-24 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="-mx-4 -mt-6 bg-white pb-36 px-5 py-20 text-center">
        <p className="mb-3 text-sm text-gray-400">링크를 찾을 수 없어요.</p>
        <button type="button" onClick={() => router.back()} className="text-sm text-brand">
          뒤로 가기
        </button>
      </div>
    );
  }

  const targetUrl = getLinkTargetValue(link);
  const domain = extractDomain(targetUrl);
  const folderLabel = folder?.name ?? UNCATEGORIZED_LABEL;
  const customTitle = link.custom_title?.trim() || "";
  const previewTitle = link.preview_title?.trim() || domain || "링크";
  const previewDescription = link.preview_description?.trim() || "";
  const memo = link.memo?.trim() || "";
  const previewImage = link.preview_image?.trim() || "";
  const savedDate = new Date(link.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const menuTitle = customTitle || previewTitle || domain || "링크";
  const isFavorite = favoriteIds.has(link.id);
  const faviconUrl = targetUrl
    ? `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(targetUrl)}`
    : "";

  return (
    <>
      <div className="-mx-4 -mt-6 bg-white pb-36">
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">
            {folderLabel}
          </p>

          <div className={`flex items-start gap-3 ${customTitle ? "mt-2" : "mt-1 justify-end"}`}>
            {customTitle ? (
              <h1 className="min-w-0 flex-1 text-[20px] font-bold leading-tight text-[#111]">
                {customTitle}
              </h1>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(link.id)}
                className="flex h-8 w-8 items-center justify-center text-[20px] leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                style={{ color: isFavorite ? "#F5C518" : "#ccc" }}
              >
                {isFavorite ? "★" : "☆"}
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center text-[18px] leading-none text-[#ccc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="더보기"
              >
                ···
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {faviconUrl && !faviconFailed ? (
              <img
                src={faviconUrl}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-sm"
                onError={() => setFaviconFailed(true)}
              />
            ) : (
              <LinkIcon />
            )}
            <p className="min-w-0 truncate text-[12px] text-[#aaa]">{previewTitle}</p>
          </div>

          {previewDescription ? (
            <p className="mt-3 text-[13px] leading-5 text-[#999]">{previewDescription}</p>
          ) : null}
        </div>

        <div className="h-2 bg-[#f5f5f5]" />

        <div className="space-y-4 px-5 py-5">
          {memo ? <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#333]">{memo}</p> : null}

          {previewImage ? (
            <img
              src={previewImage}
              alt={previewTitle}
              className="w-full rounded-[12px] object-cover"
            />
          ) : null}

          <button
            type="button"
            onClick={handleOpenLink}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#e0e0e0] px-4 py-3 text-[14px] font-bold text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ExternalLinkIcon />
            링크 열기
          </button>

          <p className="text-[12px] text-[#bbb]">{savedDate}</p>
        </div>
      </div>

      <EditLinkModal
        link={editOpen ? link : null}
        folders={sortedFolders}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      {menuOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          <BottomSheetShell ariaLabel="링크 관리" onClose={() => setMenuOpen(false)}>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">링크 관리</h2>
              <p className="mb-5 truncate text-sm text-gray-500">{menuTitle}</p>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <ActionButton
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpenLink();
                  }}
                >
                  열기
                </ActionButton>
                <ActionDivider />
                <ActionButton
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                >
                  수정
                </ActionButton>
                <ActionDivider />
                <ActionButton
                  onClick={() => {
                    setMenuOpen(false);
                    setMoveFolderId(link.folder_id ?? "");
                    setMoveOpen(true);
                  }}
                >
                  폴더이동
                </ActionButton>
                <ActionDivider />
                <ActionButton
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  삭제
                </ActionButton>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      {moveOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!moveLoading) {
                setMoveOpen(false);
                setMovePickerOpen(false);
              }
            }}
          />

          <BottomSheetShell
            ariaLabel="폴더 이동"
            onClose={() => {
              if (!moveLoading) {
                setMoveOpen(false);
                setMovePickerOpen(false);
              }
            }}
          >
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">폴더 이동</h2>
              <p className="mb-5 truncate text-sm text-gray-500">{menuTitle}</p>

              <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                폴더
              </label>

              <FolderSelectTrigger
                value={sortedFolders.find((nextFolder) => nextFolder.id === moveFolderId)?.name ?? UNCATEGORIZED_LABEL}
                muted={!moveFolderId}
                tone={moveFolderId ? "selected" : "neutral"}
                onClick={() => setMovePickerOpen(true)}
              />

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMoveOpen(false);
                    setMovePickerOpen(false);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void handleMoveLink()}
                  disabled={moveLoading}
                  className="flex-1 rounded-lg bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {moveLoading ? "이동 중..." : "이동"}
                </button>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

      <FolderSelectSheet
        open={movePickerOpen}
        title="폴더 선택"
        folders={sortedFolders}
        value={moveFolderId || UNCATEGORIZED_VALUE}
        onClose={() => setMovePickerOpen(false)}
        onSelect={(nextValue) => {
          setMoveFolderId(nextValue === UNCATEGORIZED_VALUE ? "" : nextValue);
          setMovePickerOpen(false);
        }}
        specialOptions={[
          {
            value: UNCATEGORIZED_VALUE,
            label: UNCATEGORIZED_LABEL,
          },
        ]}
        disabled={moveLoading}
      />

      <ConfirmModal
        open={deleteOpen}
        title="링크를 삭제할까요?"
        message="삭제한 링크는 다시 되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}

function ActionButton({
  children,
  destructive = false,
  onClick,
}: {
  children: ReactNode;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-left text-sm font-medium transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset active:bg-gray-100 ${
        destructive ? "text-red-500" : "text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function ActionDivider() {
  return <div className="mx-4 h-px bg-gray-100" />;
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#aaa"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M15 7h3a5 5 0 0 1 0 10h-3" />
      <path d="M9 17H6A5 5 0 1 1 6 7h3" />
      <path d="M8 12h8" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5B6FF5"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
