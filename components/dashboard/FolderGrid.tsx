import Link from "next/link";
import type { FolderWithCount } from "@/types";

const FOLDER_EMOJIS = ["📁", "⭐", "💡", "🎯", "📚", "🎨", "🔖", "💼", "🌐", "🎵", "🏷️", "🔗"];

interface FolderGridProps {
  folders: FolderWithCount[];
}

export default function FolderGrid({ folders }: FolderGridProps) {
  if (folders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center">
        <p className="text-2xl mb-2">📂</p>
        <p className="text-sm text-gray-400 font-medium">폴더가 없어요</p>
        <p className="text-xs text-gray-300 mt-1">위 버튼으로 폴더를 만들어보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {folders.map((folder, index) => {
        const emoji = FOLDER_EMOJIS[index % FOLDER_EMOJIS.length];
        return (
          <Link
            key={folder.id}
            href={`/links?folder=${folder.id}`}
            className="bg-white rounded-2xl border border-gray-100 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition shadow-sm"
          >
            <div className="text-2xl mb-2">{emoji}</div>
            <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {folder.link_count > 0 ? `${folder.link_count}개` : "비어있음"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
