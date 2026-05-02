import type { Metadata } from "next";
import FoldersPageClient from "@/components/folder/FoldersPageClient";

export const metadata: Metadata = {
  title: "내 폴더 | 링코",
};

export default function FoldersPage() {
  return <FoldersPageClient />;
}
