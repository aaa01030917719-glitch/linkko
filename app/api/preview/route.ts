import { NextRequest, NextResponse } from "next/server";
import type { LinkPreview } from "@/types";

/**
 * GET /api/preview?url=https://...
 * 서버 사이드에서 OG 태그를 파싱해 미리보기 데이터를 반환
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Linkkobot/1.0)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "페이지를 가져올 수 없습니다." }, { status: 502 });
    }

    const html = await res.text();
    const preview = parseOgTags(html);

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "미리보기 생성에 실패했습니다." }, { status: 500 });
  }
}

function parseOgTags(html: string): LinkPreview {
  const getMeta = (property: string): string | null => {
    const match =
      html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"));
    return match?.[1] ?? null;
  };

  const getTitle = (): string | null => {
    const og = getMeta("og:title");
    if (og) return og;
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim() ?? null;
  };

  return {
    title: getTitle(),
    description: getMeta("og:description"),
    image: getMeta("og:image"),
    site_name: getMeta("og:site_name"),
  };
}
