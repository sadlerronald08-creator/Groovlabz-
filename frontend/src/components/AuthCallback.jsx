import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithGoogleSession } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = location.hash || "";
    const sessionId = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
    (async () => {
      try {
        if (!sessionId) throw new Error("missing");
        const user = await loginWithGoogleSession(sessionId);
        window.history.replaceState(null, "", location.pathname);
        toast.success(`Signed in as ${user.name || user.email}`);
        navigate("/account", { replace: true, state: { user } });
      } catch {
        window.history.replaceState(null, "", "/login");
        toast.error("Google sign-in failed. Please try again.");
        navigate("/login", { replace: true });
      }
    })();
  }, [location, loginWithGoogleSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="mono text-xs uppercase tracking-widest text-slate-400">Signing you in with Google…</p>
      </div>
    </div>
  );
}
