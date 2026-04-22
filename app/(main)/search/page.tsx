import type { Metadata } from "next";
import SearchClient from "@/components/search/SearchClient";

export const metadata: Metadata = {
  title: "검색 | 링코",
};

export default function SearchPage() {
  return <SearchClient />;
}
