import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth";
import { formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

export default function Login({ mode = "login" }) {
  const nav = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
        toast.success("Welcome to GroovLabz");
      } else {
        await login(email, password);
        toast.success("Signed in");
      }
      nav("/account");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center" data-testid={`${mode}-page`}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="metal-border rounded-2xl p-8">
          <p className="mono-label mb-2">
            {mode === "register" ? "Create Account" : "Sign In"}
          </p>
          <h1 className="display text-3xl font-black mb-6">
            {mode === "register" ? "Join the ecosystem" : "Welcome back"}
          </h1>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mono text-[11px] uppercase tracking-widest text-slate-400 mb-1 block">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                  data-testid="register-name-input"
                />
              </div>
            )}
            <div>
              <label className="mono text-[11px] uppercase tracking-widest text-slate-400 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                data-testid={`${mode}-email-input`}
              />
            </div>
            <div>
              <label className="mono text-[11px] uppercase tracking-widest text-slate-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                data-testid={`${mode}-password-input`}
              />
            </div>
            {err && (
              <p className="text-sm text-rose-400" data-testid="auth-error">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold glow-cyan inline-flex items-center justify-center gap-2"
              data-testid={`${mode}-submit-button`}
            >
              {loading ? (
                "…"
              ) : mode === "register" ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign in
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-slate-800" />
            <span className="mono text-[10px] uppercase tracking-widest text-slate-500">or</span>
            <span className="flex-1 h-px bg-slate-800" />
          </div>
          <button
            type="button"
            onClick={() => {
              // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
              const redirectUrl = window.location.origin + "/account";
              window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
            }}
            className="w-full h-12 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-semibold inline-flex items-center justify-center gap-3 transition-colors"
            data-testid="google-signin-button"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
              <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-sm text-slate-400 text-center mt-6">
            {mode === "register" ? (
              <>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-cyan-300 hover:text-cyan-200"
                  data-testid="switch-to-login-link"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link
                  to="/register"
                  className="text-cyan-300 hover:text-cyan-200"
                  data-testid="switch-to-register-link"
                >
                  Create account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
