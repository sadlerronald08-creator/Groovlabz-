import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null while checking, {} = user, false = anon
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // CRITICAL: returning from Google OAuth — AuthCallback exchanges the session_id first.
    if (window.location.hash?.includes("session_id=")) {
      setUser(false);
      setReady(true);
      return;
    }
    const hasToken = !!localStorage.getItem("gl_token");
    if (!hasToken) {
      setUser(false);
      setReady(true);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        localStorage.removeItem("gl_token");
        setUser(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("gl_token", data.token);
    setUser(data);
    return data;
  };
  const loginWithGoogleSession = async (sessionId) => {
    const { data } = await api.post("/auth/google/session", null, { headers: { "X-Session-ID": sessionId } });
    if (data.token) localStorage.setItem("gl_token", data.token);
    setUser(data);
    return data;
  };
  const updateUser = (patch) => setUser((u) => (u ? { ...u, ...patch } : u));
  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    if (data.token) localStorage.setItem("gl_token", data.token);
    setUser(data);
    return data;
  };
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("gl_token");
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, loginWithGoogleSession, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
