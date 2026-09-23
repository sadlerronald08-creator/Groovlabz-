import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";
import { API_URL, TOKEN_KEY } from "@/src/config";

let inMemoryToken: string | null = null;

export async function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) await storage.secureSet(TOKEN_KEY, token);
  else await storage.secureRemove(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const t = await storage.secureGet<string>(TOKEN_KEY, "");
  inMemoryToken = t || null;
  return inMemoryToken;
}

async function authHeaders(): Promise<Record<string, string>> {
  const t = await getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(await authHeaders()),
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = (data && data.detail) || res.statusText || "Request failed";
    throw new ApiError(res.status, typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

// Upload a recorded / imported audio file as a new track.
export async function uploadTrack(
  sessionId: string,
  uri: string,
  fields: { name: string; source: string; duration: number; color: number },
): Promise<any> {
  const form = new FormData();
  const filename = `take.${uri.split(".").pop()?.split("?")[0] || "m4a"}`;
  const type = filename.endsWith("wav") ? "audio/wav" : filename.endsWith("mp3") ? "audio/mpeg" : "audio/m4a";
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, filename);
  } else {
    form.append("file", { uri, name: filename, type } as any);
  }
  form.append("name", fields.name);
  form.append("source", fields.source);
  form.append("duration", String(fields.duration));
  form.append("color", String(fields.color));

  const res = await fetch(`${API_URL}/sessions/${sessionId}/tracks`, {
    method: "POST",
    headers: { ...(await authHeaders()) },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new ApiError(res.status, t || "Upload failed");
  }
  return res.json();
}

// Full audio URL with token in query string (works for native headers + web <audio>).
export async function audioSource(audioUrl: string): Promise<{ uri: string }> {
  const t = await getToken();
  const sep = audioUrl.includes("?") ? "&" : "?";
  return { uri: `${API_URL.replace(/\/api$/, "")}${audioUrl}${sep}token=${encodeURIComponent(t || "")}` };
}
