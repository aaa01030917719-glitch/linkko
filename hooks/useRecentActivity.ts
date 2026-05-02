"use client";

import { useEffect, useState } from "react";
import type { Folder, Link } from "@/types";

export interface RecentLinkRecord
  extends Pick<
    Link,
    "id" | "url" | "custom_title" | "preview_title" | "preview_site_name" | "created_at"
  > {}

export interface RecentFolderRecord extends Pick<Folder, "id" | "name"> {}

const MAX_RECENT_SEARCHES = 5;
const MAX_RECENT_LINKS = 5;
const MAX_RECENT_FOLDERS = 3;

const RECENT_SEARCHES_EVENT = "linkko:recent-searches-updated";
const RECENT_LINKS_EVENT = "linkko:recent-links-updated";
const RECENT_FOLDERS_EVENT = "linkko:recent-folders-updated";

function getStorageKey(kind: "searches" | "links" | "folders", userId: string | null) {
  return `linkko:${kind}:recent:${userId ?? "anonymous"}`;
}

function readStringArray(key: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return [] as string[];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [] as string[];
  }
}

function readObjectArray<T>(key: string) {
  if (typeof window === "undefined") {
    return [] as T[];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return [] as T[];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [] as T[];
  }
}

function persistItems<T>(key: string, eventName: string, items: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(eventName, { detail: items }));
}

function subscribeToRecentItems<T>(
  key: string,
  eventName: string,
  readItems: (nextKey: string) => T[],
  onChange: (items: T[]) => void,
) {
  const sync = () => {
    onChange(readItems(key));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      sync();
    }
  };

  sync();
  window.addEventListener(eventName, sync as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(eventName, sync as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function recordRecentSearch(userId: string | null, term: string) {
  const trimmedTerm = term.trim();

  if (!trimmedTerm || typeof window === "undefined") {
    return;
  }

  const key = getStorageKey("searches", userId);
  const loweredTerm = trimmedTerm.toLowerCase();
  const nextItems = [
    trimmedTerm,
    ...readStringArray(key).filter((value) => value.toLowerCase() !== loweredTerm),
  ].slice(0, MAX_RECENT_SEARCHES);

  persistItems(key, RECENT_SEARCHES_EVENT, nextItems);
}

export function recordRecentLink(
  userId: string | null,
  link: Partial<Link> & { id: string },
) {
  if (typeof window === "undefined" || !link.url) {
    return;
  }

  const key = getStorageKey("links", userId);
  const nextItem: RecentLinkRecord = {
    id: link.id,
    url: link.url,
    custom_title: link.custom_title ?? null,
    preview_title: link.preview_title ?? null,
    preview_site_name: link.preview_site_name ?? null,
    created_at: link.created_at ?? new Date().toISOString(),
  };

  const nextItems = [
    nextItem,
    ...readObjectArray<RecentLinkRecord>(key).filter((value) => value.id !== link.id),
  ].slice(0, MAX_RECENT_LINKS);

  persistItems(key, RECENT_LINKS_EVENT, nextItems);
}

export function recordRecentFolder(
  userId: string | null,
  folder: Pick<Folder, "id" | "name">,
) {
  if (typeof window === "undefined") {
    return;
  }

  const key = getStorageKey("folders", userId);
  const nextItem: RecentFolderRecord = {
    id: folder.id,
    name: folder.name,
  };

  const nextItems = [
    nextItem,
    ...readObjectArray<RecentFolderRecord>(key).filter((value) => value.id !== folder.id),
  ].slice(0, MAX_RECENT_FOLDERS);

  persistItems(key, RECENT_FOLDERS_EVENT, nextItems);
}

export function useRecentSearches(userId: string | null) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    return subscribeToRecentItems(
      getStorageKey("searches", userId),
      RECENT_SEARCHES_EVENT,
      readStringArray,
      setRecentSearches,
    );
  }, [userId]);

  return recentSearches;
}

export function useRecentLinks(userId: string | null) {
  const [recentLinks, setRecentLinks] = useState<RecentLinkRecord[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    return subscribeToRecentItems(
      getStorageKey("links", userId),
      RECENT_LINKS_EVENT,
      readObjectArray<RecentLinkRecord>,
      setRecentLinks,
    );
  }, [userId]);

  return recentLinks;
}

export function useRecentFolders(userId: string | null) {
  const [recentFolders, setRecentFolders] = useState<RecentFolderRecord[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    return subscribeToRecentItems(
      getStorageKey("folders", userId),
      RECENT_FOLDERS_EVENT,
      readObjectArray<RecentFolderRecord>,
      setRecentFolders,
    );
  }, [userId]);

  return recentFolders;
}
