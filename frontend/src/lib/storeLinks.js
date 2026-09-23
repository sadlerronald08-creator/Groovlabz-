import { useEffect, useState } from "react";
import api from "./api";

let cache = null;

export function useStoreLinks() {
  const [links, setLinks] = useState(cache || {});
  useEffect(() => {
    if (cache) return;
    api.get("/store-links").then((r) => { cache = r.data; setLinks(r.data); }).catch(() => {});
  }, []);
  return { links, refresh: () => api.get("/store-links").then((r) => { cache = r.data; setLinks(r.data); }) };
}

export const resolveStore = (app, links) => ({
  ios: links?.[app.id]?.ios || app.store.ios,
  android: links?.[app.id]?.android || app.store.android,
  live: { ios: !!links?.[app.id]?.ios, android: !!links?.[app.id]?.android },
});
