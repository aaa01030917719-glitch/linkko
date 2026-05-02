"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FavoriteKind = "folders" | "links";

const STORAGE_PREFIX = "linkko:favorites";

export function useFavoriteIds(kind: FavoriteKind, userId: string | null | undefined) {
  const storageKey = useMemo(
    () => (userId ? `${STORAGE_PREFIX}:${kind}:${userId}` : null),
    [kind, userId],
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!storageKey) {
      setFavoriteIds(new Set());
      setLoaded(true);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(storageKey);

      if (!storedValue) {
        setFavoriteIds(new Set());
        setLoaded(true);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      const nextIds = Array.isArray(parsedValue)
        ? parsedValue.filter((value): value is string => typeof value === "string")
        : [];

      setFavoriteIds(new Set(nextIds));
    } catch {
      setFavoriteIds(new Set());
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  const persistFavoriteIds = useCallback(
    (nextFavoriteIds: Set<string>) => {
      if (typeof window === "undefined" || !storageKey) {
        return;
      }

      window.localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(nextFavoriteIds)),
      );
    },
    [storageKey],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavoriteIds((currentFavoriteIds) => {
        const nextFavoriteIds = new Set(currentFavoriteIds);

        if (nextFavoriteIds.has(id)) {
          nextFavoriteIds.delete(id);
        } else {
          nextFavoriteIds.add(id);
        }

        persistFavoriteIds(nextFavoriteIds);
        return nextFavoriteIds;
      });
    },
    [persistFavoriteIds],
  );

  const isFavorite = useCallback(
    (id: string) => favoriteIds.has(id),
    [favoriteIds],
  );

  return {
    favoriteIds,
    isFavorite,
    loaded,
    toggleFavorite,
  };
}
