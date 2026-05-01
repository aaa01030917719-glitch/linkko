"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/types";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("folders")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setFolders(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  const createFolder = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("폴더 이름을 입력해 주세요.");
      }

      const existingFolder = folders.find(
        (folder) => normalizeFolderName(folder.name) === normalizeFolderName(trimmedName),
      );

      if (existingFolder) {
        return existingFolder;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const maxOrder = folders.reduce(
        (maxValue, folder) => Math.max(maxValue, folder.sort_order),
        -1,
      );

      const { data, error: insertError } = await supabase
        .from("folders")
        .insert({
          name: trimmedName,
          sort_order: maxOrder + 1,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const createdFolder = data as Folder;

      setFolders((currentFolders) =>
        sortFolders(upsertFolder(currentFolders, createdFolder)),
      );

      return createdFolder;
    },
    [folders, supabase],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("폴더 이름을 입력해 주세요.");
      }

      const { error: updateError } = await supabase
        .from("folders")
        .update({ name: trimmedName })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          folder.id === id ? { ...folder, name: trimmedName } : folder,
        ),
      );
    },
    [supabase],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("folders")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setFolders((currentFolders) =>
        currentFolders.filter((folder) => folder.id !== id),
      );
    },
    [supabase],
  );

  const pinFolder = useCallback(
    async (id: string) => {
      const currentFolders = sortFolders(folders);
      const targetFolder = currentFolders.find((folder) => folder.id === id);

      if (!targetFolder) {
        return;
      }

      const reorderedFolders = [
        targetFolder,
        ...currentFolders.filter((folder) => folder.id !== id),
      ].map((folder, index) => ({
        ...folder,
        sort_order: index,
      }));

      for (const folder of reorderedFolders) {
        const { error: updateError } = await supabase
          .from("folders")
          .update({ sort_order: folder.sort_order })
          .eq("id", folder.id);

        if (updateError) {
          throw updateError;
        }
      }

      setFolders(reorderedFolders);
    },
    [folders, supabase],
  );

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    createFolder,
    renameFolder,
    deleteFolder,
    pinFolder,
    refetch: fetchFolders,
  };
}

function normalizeFolderName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((left, right) => left.sort_order - right.sort_order);
}

function upsertFolder(folders: Folder[], nextFolder: Folder) {
  const nextFolders = folders.filter((folder) => folder.id !== nextFolder.id);
  return [...nextFolders, nextFolder];
}
