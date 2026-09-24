import { useCallback, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";

export type Song = { id: string; title: string; artist: string; key: string; bpm?: number; notes: string; created_at: string };
export type Setlist = { id: string; name: string; song_ids: string[]; created_at: string };

const SONGS_KEY = "groovsesh_songbook_v1";
const SETS_KEY = "groovsesh_setlists_v1";

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function readList<T>(key: string): Promise<T[]> {
  const raw = await storage.getItem(key, "[]");
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function useLocalList<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readList<T>(key).then((l) => { setItems(l); setLoaded(true); });
  }, [key]);

  const persist = useCallback(async (next: T[]) => {
    setItems(next);
    await storage.setItem(key, JSON.stringify(next));
  }, [key]);

  const upsert = useCallback((item: T) => persist(items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [item, ...items]), [items, persist]);
  const remove = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);

  return { items, loaded, upsert, remove, persist };
}

export const useSongbook = () => useLocalList<Song>(SONGS_KEY);
export const useSetlists = () => useLocalList<Setlist>(SETS_KEY);
