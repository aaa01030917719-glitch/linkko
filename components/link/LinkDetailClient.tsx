"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EditLinkModal from "@/components/link/EditLinkModal";
import PreviewThumbnail from "@/components/link/PreviewThumbnail";
import BottomSheetShell from "@/components/ui/BottomSheetShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { recordRecentLink } from "@/hooks/useRecentActivity";
import { useToast } from "@/hooks/useToast";
import { extractDomain, openLinkTarget } from "@/lib/utils/url";
import type { Folder, Link as LinkType } from "@/types";

interface Props {
  id: string;
}

export default function LinkDetailClient({ id }: Props) {
  const [link, setLink] = useState<LinkType | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [moveLoading, setMoveLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);

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
          const foundFolder = folderList.find(
            (nextFolder) => nextFolder.id === nextLink.folder_id,
          );
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

    showToast("링크를 수정했어요");
  }

  async function handleMoveLink() {
    if (!link) {
      return;
    }

    setMoveLoading(true);

    try {
      const nextFolderId = moveFolderId || null;
      const { error } = await supabase
        .from("links")
        .update({ folder_id: nextFolderId })
        .eq("id", link.id);

      if (error) {
        throw error;
      }

      setLink((currentLink) =>
        currentLink ? { ...currentLink, folder_id: nextFolderId } : null,
      );
      setFolder(
        folders.find((nextFolder) => nextFolder.id === nextFolderId) ?? null,
      );
      setMoveOpen(false);
      showToast(
        nextFolderId
          ? `${folders.find((nextFolder) => nextFolder.id === nextFolderId)?.name ?? "폴더"}로 옮겼어요`
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
    const openResult = openLinkTarget(link.url);

    if (openResult === "invalid") {
      showToast("열 수 없는 링크예요.");
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 pt-2">
        <div className="mb-5 flex justify-end">
          <div className="h-8 w-8 rounded-xl bg-gray-100" />
        </div>
        <div className="h-48 rounded-3xl bg-gray-100" />
        <div className="h-36 rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="py-20 text-center">
        <p className="mb-3 text-sm text-gray-400">링크를 찾을 수 없어요</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary-500"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const title = link.custom_title || link.preview_title || extractDomain(link.url);
  const savedDate = new Date(link.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="mb-4 flex justify-end pt-1">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 active:bg-gray-200"
          aria-label="링크 메뉴"
        >
          <DotsIcon />
        </button>
      </div>

      <div className="mb-3 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <PreviewThumbnail
          image={link.preview_image}
          title={title}
          siteName={link.preview_site_name}
          url={link.url}
          className="h-48 w-full"
        />
        <div className="space-y-3.5 p-5">
          <h1 className="text-lg font-bold leading-snug text-gray-900">{title}</h1>
          <div className="flex min-w-0 items-center gap-2">
            {link.preview_site_name ? (
              <>
                <span className="shrink-0 text-sm text-gray-600">
                  {link.preview_site_name}
                </span>
                <span className="text-gray-300">·</span>
              </>
            ) : null}
            <span className="truncate text-xs text-gray-400">
              {extractDomain(link.url)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenLink}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 active:bg-primary-700"
          >
            <ExternalLinkIcon />
            링크 열기
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        {link.memo ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-300">
              메모
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {link.memo}
            </p>
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-300">
            폴더
          </p>
          <p className="text-sm text-gray-600">{folder ? folder.name : "미분류"}</p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-300">
            저장한 날짜
          </p>
          <p className="text-sm text-gray-600">{savedDate}</p>
        </div>
      </div>

      <EditLinkModal
        link={editOpen ? link : null}
        folders={folders}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      {menuOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">
                링크 관리
              </h2>
              <p className="mb-5 truncate text-sm text-gray-500">{title}</p>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
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
                  폴더 이동
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
              }
            }}
          />

          <BottomSheetShell>
            <div className="px-5 pt-3">
              <h2 className="mb-1 text-base font-bold text-gray-900">
                폴더 이동
              </h2>
              <p className="mb-5 truncate text-sm text-gray-500">{title}</p>

              <label className="mb-1.5 block pl-1 text-xs font-semibold text-gray-500">
                폴더
              </label>
              <select
                value={moveFolderId}
                onChange={(event) => setMoveFolderId(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">미분류</option>
                {folders.map((nextFolder) => (
                  <option key={nextFolder.id} value={nextFolder.id}>
                    {nextFolder.name}
                  </option>
                ))}
              </select>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMoveOpen(false)}
                  className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void handleMoveLink()}
                  disabled={moveLoading}
                  className="flex-1 rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                >
                  {moveLoading ? "이동 중..." : "이동"}
                </button>
              </div>
            </div>
          </BottomSheetShell>
        </>
      ) : null}

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
      className={`w-full px-4 py-3.5 text-left text-sm font-medium transition hover:bg-gray-50 active:bg-gray-100 ${
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

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
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
      stroke="currentColor"
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
