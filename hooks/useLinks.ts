"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/types";

export function useLinks(folderId?: string | null) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // folderId를 ref로도 보관해서 fetchLinks 내부에서 최신값 참조
  const folderIdRef = useRef(folderId);
  folderIdRef.current = folderId;

  const supabase = createClient();

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("links")
      .select("*")
      .order("created_at", { ascending: false });

    const current = folderIdRef.current;
    if (current === null) {
      query = query.is("folder_id", null);
    } else if (current !== undefined) {
      query = query.eq("folder_id", current);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setLinks(data ?? []);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addLink(payload: Partial<Link>) {
    const { data, error } = await supabase.from("links").insert(payload).select().single();
    if (error) throw error;
    setLinks((prev) => [data as Link, ...prev]);
    return data as Link;
  }

  async function updateLink(id: string, payload: Partial<Link>) {
    const { error } = await supabase.from("links").update(payload).eq("id", id);
    if (error) throw error;
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...payload } : l)));
  }

  async function deleteLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) throw error;
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  useEffect(() => {
    fetchLinks();
  }, [folderId, fetchLinks]);

  return { links, loading, error, addLink, updateLink, deleteLink, refetch: fetchLinks };
}
