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
