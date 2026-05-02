const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const DOMAIN_LIKE_REGEX =
  /^(?:www\.|localhost(?::\d+)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(?:[/?#].*)?$/;

export type LinkOpenResult = "opened" | "external" | "invalid";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * 사용자가 입력한 문자열을 저장/미리보기용 URL 형태로 정규화한다.
 * scheme이 없으면 https:// 를 붙인다.
 */
export function normalizeUrlInput(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  if (SCHEME_REGEX.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  if (DOMAIN_LIKE_REGEX.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }

  return trimmedUrl;
}

export function getUrlScheme(url: string): string | null {
  const normalizedUrl = normalizeUrlInput(url);
  const matchedScheme = normalizedUrl.match(SCHEME_REGEX);

  return matchedScheme ? matchedScheme[0].slice(0, -1).toLowerCase() : null;
}

/**
 * URL에서 도메인만 추출한다.
 * ex) "https://www.example.com/foo" -> "example.com"
 */
export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(normalizeUrlInput(url));
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getHttpUrl(url: string): string | null {
  const normalizedUrl = normalizeUrlInput(url);

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

/**
 * http/https 기반의 일반 링크인지 확인한다.
 */
export function isValidUrl(url: string): boolean {
  return getHttpUrl(url) !== null;
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

/**
 * 저장된 링크를 현재 환경에서 가장 안전한 방식으로 연다.
 * - http/https: 새 탭
 * - 앱 스킴: RN WebView 브리지 또는 브라우저 location
 * - 그 외: invalid
 */
export function openLinkTarget(url: string): LinkOpenResult {
  if (typeof window === "undefined") {
    return "invalid";
  }

  const normalizedUrl = normalizeUrlInput(url);
  if (!normalizedUrl) {
    return "invalid";
  }

  const httpUrl = getHttpUrl(normalizedUrl);

  if (httpUrl) {
    if (requestNativeExternalOpen(httpUrl)) {
      return "external";
    }

    window.open(httpUrl, "_blank", "noopener,noreferrer");
    return "opened";
  }

  const scheme = getUrlScheme(normalizedUrl);

  if (!scheme) {
    return "invalid";
  }

  if (requestNativeExternalOpen(normalizedUrl)) {
    return "external";
  }

  try {
    window.location.assign(normalizedUrl);
    return "external";
  } catch {
    return "invalid";
  }
}
