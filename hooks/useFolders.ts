"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/types";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setFolders(data ?? []);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFolder(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("폴더 이름을 입력해 주세요.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    const maxOrder = folders.reduce((max, f) => Math.max(max, f.sort_order), -1);
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: trimmedName, sort_order: maxOrder + 1, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setFolders((prev) => [...prev, data as Folder]);
    return data as Folder;
  }

  async function renameFolder(id: string, name: string) {
    const { error } = await supabase.from("folders").update({ name }).eq("id", id);
    if (error) throw error;
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  }

  async function deleteFolder(id: string) {
    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) throw error;
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    createFolder,
    renameFolder,
    deleteFolder,
    refetch: fetchFolders,
  };
}
