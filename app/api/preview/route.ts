import { NextRequest, NextResponse } from "next/server";
import type { LinkPreview } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "페이지를 가져올 수 없습니다." }, { status: 502 });
    }

    const html = await res.text();
    return NextResponse.json(parseOgTags(html, url));
  } catch {
    return NextResponse.json({ error: "미리보기 생성에 실패했습니다." }, { status: 500 });
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function parseOgTags(html: string, requestUrl: string): LinkPreview {
  // 모든 meta 태그를 순회해 property/name → content 맵 생성
  const metaMap: Record<string, string> = {};
  const metaRegex = /<meta\s+([^>]+?)(?:\s*\/)?>/gi;
  let m: RegExpExecArray | null;

  while ((m = metaRegex.exec(html)) !== null) {
    const attrs = m[1];
    const key =
      attrValue(attrs, "property") ?? attrValue(attrs, "name");
    const content = attrValue(attrs, "content");
    if (key && content) {
      metaMap[key.toLowerCase()] = content;
    }
  }

  const decode = (v: string | null | undefined) =>
    v ? decodeHtmlEntities(v) : null;

  // title: og:title → twitter:title → <title>
  const getTitle = (): string | null => {
    const raw =
      metaMap["og:title"] ??
      metaMap["twitter:title"] ??
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ??
      null;
    return decode(raw);
  };

  // image: og:image → twitter:image, 이미지를 차단하는 도메인은 null 반환
  const getImage = (): string | null => {
    const raw = metaMap["og:image"] ?? metaMap["twitter:image"] ?? null;
    if (!raw) return null;
    try {
      const imageUrl = new URL(raw, requestUrl).href;
      const blocked = ["instagram.com", "fbcdn.net", "facebook.com"];
      if (blocked.some((d) => imageUrl.includes(d))) return null;
      return imageUrl;
    } catch {
      return null;
    }
  };

  return {
    title: getTitle(),
    description: decode(
      metaMap["og:description"] ?? metaMap["twitter:description"]
    ),
    image: getImage(),
    site_name: decode(metaMap["og:site_name"]),
  };
}

// <meta> 속성 문자열에서 특정 속성값 추출 (큰따옴표/작은따옴표 모두 처리)
function attrValue(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*?)["']`, "i"));
  return match?.[1] ?? null;
}
