"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "linkko.pending-share-payload";
const LEGACY_STORAGE_KEY = "linkko.pending-share-url";
const EVENT_NAME = "linkko-native-share";

export interface PendingSharedLink {
  text: string | null;
  url: string | null;
}

function normalizeSharedPayload(payload: Partial<PendingSharedLink> | null | undefined) {
  const url = payload?.url?.trim() || null;
  const text = payload?.text?.trim() || null;

  if (!url && !text) {
    return null;
  }

  return {
    text,
    url,
  };
}

function readStoredPayload() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawPayload = window.localStorage.getItem(STORAGE_KEY);

  if (rawPayload) {
    try {
      const parsedPayload = JSON.parse(rawPayload) as
        | Partial<PendingSharedLink>
        | string;

      if (typeof parsedPayload === "string") {
        return normalizeSharedPayload({ text: null, url: parsedPayload });
      }

      return normalizeSharedPayload(parsedPayload);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const legacyUrl = window.localStorage.getItem(LEGACY_STORAGE_KEY)?.trim() || null;
  return normalizeSharedPayload({ text: null, url: legacyUrl });
}

function writeStoredPayload(payload: PendingSharedLink | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!payload) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  if (payload.url) {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, payload.url);
  } else {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export function usePendingSharedLink(
  initialPayload?: Partial<PendingSharedLink> | null,
) {
  const [sharedPayload, setSharedPayload] = useState<PendingSharedLink | null>(
    () => normalizeSharedPayload(initialPayload) ?? null,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSharedPayload = () => {
      const nextPayload =
        normalizeSharedPayload(initialPayload) ?? readStoredPayload();
      setSharedPayload(nextPayload);
    };

    const handleNativeShare = (event: Event) => {
      const detail = (event as CustomEvent<Partial<PendingSharedLink>>).detail;
      const nextPayload =
        normalizeSharedPayload(detail) ??
        normalizeSharedPayload(initialPayload) ??
        readStoredPayload();

      if (!nextPayload) {
        return;
      }

      writeStoredPayload(nextPayload);
      setSharedPayload(nextPayload);
    };

    syncSharedPayload();
    window.addEventListener(EVENT_NAME, handleNativeShare as EventListener);
    window.addEventListener("storage", syncSharedPayload);

    return () => {
      window.removeEventListener(EVENT_NAME, handleNativeShare as EventListener);
      window.removeEventListener("storage", syncSharedPayload);
    };
  }, [initialPayload?.text, initialPayload?.url]);

  const clearPendingSharedLink = () => {
    writeStoredPayload(null);
    setSharedPayload(null);
  };

  return {
    clearPendingSharedLink,
    sharedText: sharedPayload?.text ?? null,
    sharedUrl: sharedPayload?.url ?? null,
  };
}
