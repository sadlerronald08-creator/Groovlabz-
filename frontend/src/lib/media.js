import { useEffect, useState } from "react";
import api, { mediaUrl } from "./api";

let cache = null;
let listeners = new Set();

const load = () =>
  api
    .get("/media-overrides")
    .then((r) => {
      cache = Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, mediaUrl(v)]));
      listeners.forEach((fn) => fn(cache));
    })
    .catch(() => {
      cache = cache || {};
    });

export function refreshMediaOverrides() {
  cache = null;
  return load();
}

export function useMediaOverrides() {
  const [state, setState] = useState(cache || {});
  useEffect(() => {
    listeners.add(setState);
    if (cache) setState(cache);
    else load();
    return () => listeners.delete(setState);
  }, []);
  return state;
}
