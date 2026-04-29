const DEFAULT_NEXT_PATH = "/dashboard";

export function normalizeNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return next;
}

export function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getOAuthRedirectUrl(next?: string | null) {
  const url = new URL("/auth/callback", getSiteUrl());
  const safeNext = normalizeNextPath(next);

  if (safeNext !== DEFAULT_NEXT_PATH) {
    url.searchParams.set("next", safeNext);
  }

  return url.toString();
}

export function getEmailConfirmationRedirectUrl(next?: string | null) {
  const url = new URL("/auth/confirm", getSiteUrl());
  url.searchParams.set("next", normalizeNextPath(next));
  return url.toString();
}

