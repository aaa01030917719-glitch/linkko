import "server-only";

import type { SafePostyResponse } from "@/lib/posty/payload";

const POSTY_EVENTS_PATH = "/api/integrations/linkko/events";
const SAFE_RESPONSE_TEXT_LIMIT = 300;

export interface PostySyncClientConfig {
  apiBaseUrl: string;
  syncSecret: string;
}

export function getPostySyncClientConfig(): PostySyncClientConfig | null {
  const apiBaseUrl = process.env.POSTY_SYNC_API_BASE_URL?.trim();
  const syncSecret = process.env.LINKKO_POSTY_SYNC_SECRET?.trim();

  if (!apiBaseUrl || !syncSecret) {
    return null;
  }

  if (!isValidHttpUrl(apiBaseUrl)) {
    return null;
  }

  return {
    apiBaseUrl,
    syncSecret,
  };
}

export async function postLinkkoEventToPosty(
  config: PostySyncClientConfig,
  payload: unknown,
): Promise<SafePostyResponse> {
  const response = await fetch(buildPostyEventsUrl(config.apiBaseUrl).toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.syncSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await readSafeResponseBody(response),
  };
}

function buildPostyEventsUrl(apiBaseUrl: string) {
  return new URL(POSTY_EVENTS_PATH, ensureTrailingSlash(apiBaseUrl));
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

async function readSafeResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = (await response.text()).slice(0, SAFE_RESPONSE_TEXT_LIMIT);

  if (!text) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return pickSafeJsonFields(JSON.parse(text));
    } catch {
      return { text };
    }
  }

  return { text };
}

function pickSafeJsonFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { value: String(value).slice(0, SAFE_RESPONSE_TEXT_LIMIT) };
  }

  const source = value as Record<string, unknown>;
  const safeBody: Record<string, string | number | boolean | null> = {};

  for (const key of ["error", "code", "message", "status"]) {
    const field = source[key];

    if (
      typeof field === "string" ||
      typeof field === "number" ||
      typeof field === "boolean" ||
      field === null
    ) {
      safeBody[key] =
        typeof field === "string" ? field.slice(0, SAFE_RESPONSE_TEXT_LIMIT) : field;
    }
  }

  return Object.keys(safeBody).length > 0 ? safeBody : { error: "posty_error" };
}
