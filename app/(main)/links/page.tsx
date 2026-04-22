import { Suspense } from "react";
import type { Metadata } from "next";
import LinksClient from "@/components/links/LinksClient";
import Spinner from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "링크 | 링코",
};

export default function LinksPage() {
  return (
    // useSearchParams()를 사용하는 LinksClient는 반드시 Suspense로 감싸야 함
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <LinksClient />
    </Suspense>
  );
}
