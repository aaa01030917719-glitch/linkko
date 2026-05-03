const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const DOMAIN_LIKE_REGEX =
  /^(?:www\.|localhost(?::\d+)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(?:[/?#].*)?$/;
const BLOCKED_SCHEMES = new Set(["about", "blob", "data", "file", "javascript"]);

export type LinkOpenResult = "opened" | "external" | "invalid";
export const LINK_OPEN_ERROR_MESSAGE = "링크를 열 수 없어요. 주소를 확인해주세요.";

type LinkTargetLike =
  | string
  | null
  | undefined
  | {
      url?: unknown;
      href?: unknown;
      link?: unknown;
    };

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getLinkTargetValue(target: LinkTargetLike): string {
  if (typeof target === "string") {
    return target.trim();
  }

  if (!target || typeof target !== "object") {
    return "";
  }

  return (
    readStringValue(target.url) ||
    readStringValue(target.href) ||
    readStringValue(target.link)
  );
}

export function normalizeUrlInput(target: LinkTargetLike): string {
  const rawUrl = getLinkTargetValue(target);

  if (!rawUrl) {
    return "";
  }

  if (SCHEME_REGEX.test(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith("//")) {
    return `https:${rawUrl}`;
  }

  if (DOMAIN_LIKE_REGEX.test(rawUrl)) {
    return `https://${rawUrl}`;
  }

  return rawUrl;
}

export function getUrlScheme(target: LinkTargetLike): string | null {
  const normalizedUrl = normalizeUrlInput(target);
  const matchedScheme = normalizedUrl.match(SCHEME_REGEX);

  return matchedScheme ? matchedScheme[0].slice(0, -1).toLowerCase() : null;
}

export function extractDomain(target: LinkTargetLike): string {
  const normalizedUrl = normalizeUrlInput(target);

  if (!normalizedUrl) {
    return "";
  }

  try {
    const { hostname } = new URL(normalizedUrl);
    return hostname.replace(/^www\./, "");
  } catch {
    return normalizedUrl;
  }
}

export function getHttpUrl(target: LinkTargetLike): string | null {
  const normalizedUrl = normalizeUrlInput(target);

  try {
    const parsedUrl = new URL(normalizedUrl);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidUrl(target: LinkTargetLike): boolean {
  return getHttpUrl(target) !== null;
}

function requestNativeExternalOpen(url: string) {
  if (
    typeof window === "undefined" ||
    typeof window.ReactNativeWebView?.postMessage !== "function"
  ) {
    return false;
  }

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "open-external-url",
      url,
    }),
  );

  return true;
}

function openInNewTab(url: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const nextWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (nextWindow) {
      nextWindow.opener = null;
    }

    return nextWindow !== null;
  } catch {
    return false;
  }
}

export function openLinkTarget(target: LinkTargetLike): LinkOpenResult {
  if (typeof window === "undefined") {
    return "invalid";
  }

  const normalizedUrl = normalizeUrlInput(target);

  if (!normalizedUrl) {
    return "invalid";
  }

  const httpUrl = getHttpUrl(normalizedUrl);

  if (httpUrl) {
    if (requestNativeExternalOpen(httpUrl)) {
      return "external";
    }

    return openInNewTab(httpUrl) ? "opened" : "invalid";
  }

  const scheme = getUrlScheme(normalizedUrl);

  if (!scheme) {
    return "invalid";
  }

  if (BLOCKED_SCHEMES.has(scheme)) {
    return "invalid";
  }

  if (requestNativeExternalOpen(normalizedUrl)) {
    return "external";
  }

  return openInNewTab(normalizedUrl) ? "opened" : "invalid";
}
