import { NextRequest, NextResponse } from "next/server";
import type { LinkPreview } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko,en;q=0.9",
};

const BLOCKED_IMAGE_HOSTS = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "facebook.com",
];

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const LOG_PREFIX = "[preview-api]";
const HTML_LOG_SNIPPET_LENGTH = 500;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { error: "Missing url query parameter." },
      { status: 400 }
    );
  }

  const targetUrl = parseHttpUrl(rawUrl);

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Only http and https URLs are supported." },
      { status: 400 }
    );
  }

  try {
    console.log(`${LOG_PREFIX} fetching target`, { url: targetUrl.href });

    const response = await fetch(targetUrl.href, {
      headers: PREVIEW_FETCH_HEADERS,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");

    console.log(`${LOG_PREFIX} fetch response`, {
      url: targetUrl.href,
      finalUrl: response.url,
      status: response.status,
      contentType,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch the requested page." },
        { status: 502 }
      );
    }

    const html = await response.text();
    console.log(`${LOG_PREFIX} html snippet`, {
      url: targetUrl.href,
      snippet: toLogSnippet(html),
    });

    const preview = parseLinkPreview(html, targetUrl.href);

    console.log(`${LOG_PREFIX} preview result`, {
      url: targetUrl.href,
      preview,
    });

    return NextResponse.json(preview, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    console.error(`${LOG_PREFIX} request failed`, { url: targetUrl.href });

    return NextResponse.json(
      { error: "Failed to create a link preview." },
      { status: 500 }
    );
  }
}

function parseLinkPreview(html: string, requestUrl: string): LinkPreview {
  const meta = parseMetaTags(html);
  const titleSource = selectFirst([
    { key: "og:title", value: meta["og:title"] },
    { key: "twitter:title", value: meta["twitter:title"] },
    { key: "title", value: extractTitle(html) },
  ]);
  const descriptionSource = selectFirst([
    { key: "og:description", value: meta["og:description"] },
    { key: "twitter:description", value: meta["twitter:description"] },
    { key: "description", value: meta["description"] },
  ]);
  const siteNameSource = selectFirst([
    { key: "og:site_name", value: meta["og:site_name"] },
  ]);
  const imageSource = meta["og:image"] ?? meta["twitter:image"] ?? null;
  const resolvedImage = imageSource
    ? resolveUrl(decodeHtmlEntities(imageSource), requestUrl)
    : null;
  const preview = {
    title: normalizePreviewText(titleSource?.value ?? null),
    description: normalizePreviewText(descriptionSource?.value ?? null),
    image:
      resolvedImage && !shouldBlockPreviewImage(resolvedImage, requestUrl)
        ? resolvedImage
        : null,
    site_name: normalizePreviewText(siteNameSource?.value ?? null),
  };

  console.log(`${LOG_PREFIX} parsed meta sources`, {
    url: requestUrl,
    ogTitle: normalizePreviewText(meta["og:title"]),
    twitterTitle: normalizePreviewText(meta["twitter:title"]),
    titleTag: normalizePreviewText(extractTitle(html)),
    selectedTitleSource: titleSource?.key ?? null,
    ogDescription: normalizePreviewText(meta["og:description"]),
    twitterDescription: normalizePreviewText(meta["twitter:description"]),
    metaDescription: normalizePreviewText(meta["description"]),
    ogSiteName: normalizePreviewText(meta["og:site_name"]),
    ogImage: imageSource,
    resolvedImage,
    imageBlocked: Boolean(resolvedImage && preview.image === null),
  });

  return preview;
}

function parseMetaTags(html: string): Record<string, string> {
  const metaMap: Record<string, string> = {};
  const metaTagPattern = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaTagPattern.exec(html)) !== null) {
    const attributes = extractAttributes(match[0]);
    const key = attributes.property ?? attributes.name;
    const content = attributes.content;

    if (key && content) {
      metaMap[key.toLowerCase()] = content;
    }
  }

  return metaMap;
}

function extractAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern =
    /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(tag)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    attributes[name.toLowerCase()] =
      doubleQuoted ?? singleQuoted ?? unquoted ?? "";
  }

  return attributes;
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch?.[1] ?? null;
}

function normalizePreviewText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim();

  return decoded || null;
}

function selectFirst(
  candidates: Array<{ key: string; value: string | null | undefined }>
) {
  return candidates.find((candidate) => normalizePreviewText(candidate.value));
}

function decodeHtmlEntities(value: string): string {
  let decoded = value;

  for (let i = 0; i < 3; i += 1) {
    const next = decoded
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        decodeCodePoint(hex, 16, `&#x${hex};`)
      )
      .replace(/&#([0-9]+);/g, (_, decimal) =>
        decodeCodePoint(decimal, 10, `&#${decimal};`)
      )
      .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (entity, name) => {
        return NAMED_HTML_ENTITIES[name.toLowerCase()] ?? entity;
      });

    if (next === decoded) {
      break;
    }

    decoded = next;
  }

  return decoded;
}

function decodeCodePoint(
  value: string,
  radix: number,
  fallback: string
): string {
  const codePoint = Number.parseInt(value, radix);

  if (!Number.isFinite(codePoint) || codePoint < 0) {
    return fallback;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

function resolveUrl(value: string, baseUrl: string): string | null {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
}

function shouldBlockPreviewImage(imageUrl: string, pageUrl: string): boolean {
  const hostnames = [getHostname(imageUrl), getHostname(pageUrl)].filter(
    (hostname): hostname is string => Boolean(hostname)
  );

  return hostnames.some((hostname) =>
    BLOCKED_IMAGE_HOSTS.some(
      (blockedHost) =>
        hostname === blockedHost || hostname.endsWith(`.${blockedHost}`)
    )
  );
}

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function toLogSnippet(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .slice(0, HTML_LOG_SNIPPET_LENGTH);
}
