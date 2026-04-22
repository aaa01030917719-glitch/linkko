import type { Metadata } from "next";
import LinkDetailClient from "@/components/link/LinkDetailClient";

export const metadata: Metadata = {
  title: "링크 상세 | Linkko",
};

interface Props {
  params: { id: string };
}

export default function LinkDetailPage({ params }: Props) {
  return <LinkDetailClient id={params.id} />;
}
