import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { apiFetch, setToken, getToken } from "@/src/api";

WebBrowser.maybeCompleteAuthSession();

export type User = { id: string; email: string; name: string; picture?: string | null };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const processedSessions = new Set<string>();

function extractSessionId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const exchangeSession = useCallback(async (sessionId: string) => {
    if (processedSessions.has(sessionId)) return;
    processedSessions.add(sessionId);
    const data = await apiFetch<{ session_token: string; user: User }>("/auth/session", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });
    await setToken(data.session_token);
    setUser(data.user);
  }, []);

  const checkExisting = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const data = await apiFetch<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      await setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let sub: Linking.EventSubscription | undefined;
    (async () => {
      try {
        if (Platform.OS === "web") {
          const hash = typeof window !== "undefined" ? window.location.hash : "";
          const search = typeof window !== "undefined" ? window.location.search : "";
          const sid = extractSessionId(hash) || extractSessionId(search);
          if (sid) {
            await exchangeSession(sid);
            if (typeof window !== "undefined") {
              window.history.replaceState(window.history.state, "", window.location.pathname);
            }
          } else {
            await checkExisting();
          }
        } else {
          const initial = await Linking.getInitialURL();
          const sid = extractSessionId(initial);
          if (sid) await exchangeSession(sid);
          else await checkExisting();
          sub = Linking.addEventListener("url", async ({ url }) => {
            const s = extractSessionId(url);
            if (s) {
              try {
                await exchangeSession(s);
              } catch {}
            }
          });
        }
      } catch {
        await checkExisting();
      } finally {
        setLoading(false);
      }
    })();
    return () => sub?.remove();
  }, [exchangeSession, checkExisting]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ session_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.session_token);
    setUser(data.user);
  }, []);

  const signUpEmail = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiFetch<{ session_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    await setToken(data.session_token);
    setUser(data.user);
  }, []);

  const signInGoogle = useCallback(async () => {
    const redirectUrl = Platform.OS === "web" ? window.location.origin + "/" : Linking.createURL("");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    let sid: string | null = null;
    if (result.type === "success" && result.url) sid = extractSessionId(result.url);
    if (!sid) sid = extractSessionId(await Linking.getInitialURL());
    if (sid) await exchangeSession(sid);
  }, [exchangeSession]);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    await setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInEmail, signUpEmail, signInGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
