"use client";

import { useMemo, useState } from "react";
import { useFolders } from "@/hooks/useFolders";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/useToast";
import { isWithinDays } from "@/lib/utils/time";
import NewLinkBanner from "@/components/dashboard/NewLinkBanner";
import FolderGrid from "@/components/dashboard/FolderGrid";
import RecentLinks from "@/components/dashboard/RecentLinks";
import FolderManager from "@/components/folder/FolderManager";
import AddLinkModal from "@/components/link/AddLinkModal";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Toast from "@/components/ui/Toast";
import type { Link } from "@/types";

export default function DashboardClient() {
  const [addOpen, setAddOpen] = useState(false);
  const { toast, showToast } = useToast();

  const { folders, error: foldersError, createFolder, renameFolder, deleteFolder, refetch: refetchFolders } = useFolders();
  const { links, loading, error: linksError, addLink, refetch: refetchLinks } = useLinks();

  const newLinksCount = useMemo(
    () => links.filter((l) => isWithinDays(l.created_at, 7)).length,
    [links]
  );

  const foldersWithCount = useMemo(
    () =>
      folders.map((f) => ({
        ...f,
        link_count: links.filter((l) => l.folder_id === f.id).length,
      })),
    [folders, links]
  );

  const recentLinks = useMemo(() => links.slice(0, 5), [links]);

  async function handleAddLink(payload: Partial<Link>) {
    try {
      await addLink(payload);
      showToast("링크가 저장됐어요 🎉");
      setAddOpen(false);
    } catch {
      showToast("저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <>
      <div className="space-y-7 pb-36">
        {/* 인사 헤더 */}
        <header className="pt-2">
          <p className="text-base text-gray-500 font-medium">안녕하세요 👋</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1 leading-tight">
            링크{" "}
            <span className="text-primary-500">
              {loading ? (
                <span className="inline-block w-8 h-7 bg-gray-100 rounded-lg animate-pulse align-middle" />
              ) : (
                `${links.length}개`
              )}
            </span>{" "}
            저장됨
          </h2>
        </header>

        {/* 에러 */}
        {(foldersError || linksError) && (
          <ErrorBanner
            message="데이터를 불러오지 못했어요."
            onRetry={() => { refetchLinks(); refetchFolders(); }}
          />
        )}

        {/* 새 링크 배너 */}
        {!loading && newLinksCount > 0 && (
          <NewLinkBanner count={newLinksCount} />
        )}

        {/* 내 폴더 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">내 폴더</h3>
            <FolderManager
              folders={folders}
              onCreate={createFolder}
              onRename={renameFolder}
              onDelete={deleteFolder}
            />
          </div>
          <FolderGrid folders={foldersWithCount} />
        </section>

        {/* 최근 저장 */}
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">최근 저장</h3>
          <RecentLinks links={recentLinks} loading={loading} />
        </section>
      </div>

      {/* 하단 고정 링크 저장 버튼 */}
      <div className="fixed bottom-16 inset-x-0 z-20 px-4 pb-2 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-2xl bg-primary-500 py-4 text-sm font-bold text-white
              shadow-xl shadow-primary-500/35 hover:bg-primary-600 active:bg-primary-700
              transition flex items-center justify-center gap-2"
          >
            <PlusIcon />
            링크 저장
          </button>
        </div>
      </div>

      <AddLinkModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        folders={folders}
        onAdd={handleAddLink}
        onCreateFolder={createFolder}
      />
      {toast && <Toast message={toast} />}
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
