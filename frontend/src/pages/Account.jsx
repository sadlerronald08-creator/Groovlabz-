import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Zap, ShoppingBag, Activity } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { APPS } from "../data/apps";
import AvatarUpload from "../components/AvatarUpload";

export default function Account() {
  const { user, ready, logout } = useAuth();
  const nav = useNavigate();
  const [dash, setDash] = useState(null);

  useEffect(() => {
    if (ready && (!user || !user.id)) nav("/login");
  }, [ready, user, nav]);

  useEffect(() => {
    if (user && user.id) {
      api.get("/account/dashboard").then((r) => setDash(r.data)).catch(() => {});
    }
  }, [user]);

  const logHello = async (appId) => {
    await api.post("/activity", { app_id: appId, action: "connected", details: "from web dashboard" });
    const r = await api.get("/account/dashboard");
    setDash(r.data);
  };

  if (!user || !user.id) return null;

  return (
    <div className="pt-24 pb-16" data-testid="account-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-start gap-5">
            <AvatarUpload />
            <div>
              <p className="mono-label mb-2">Signed in</p>
              <h1 className="display text-3xl sm:text-4xl font-black">
                Hey {user.name?.split(" ")[0] || "producer"} 
                <span className="text-cyan-300"> — welcome to the console.</span>
              </h1>
            <p className="text-slate-400 mt-1 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <>
                <Link
                  to="/admin/store-links"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-sm font-semibold"
                  data-testid="admin-store-links-link"
                >
                  Store links
                </Link>
                <Link
                  to="/admin/media"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-sm font-semibold"
                  data-testid="admin-media-link"
                >
                  Photos & screens
                </Link>
              </>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full metal-border text-slate-300 hover:border-rose-400/50 hover:text-rose-300"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="metal-border rounded-2xl p-5" data-testid="stat-orders">
            <p className="mono-label mb-2">Orders</p>
            <p className="display text-4xl font-black text-cyan-300">
              {dash?.stats?.orders_count ?? 0}
            </p>
          </div>
          <div className="metal-border rounded-2xl p-5" data-testid="stat-spent">
            <p className="mono-label mb-2">Total spent</p>
            <p className="display text-4xl font-black text-cyan-300">
              ${dash?.stats?.total_spent?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="metal-border rounded-2xl p-5" data-testid="stat-apps">
            <p className="mono-label mb-2">Apps connected</p>
            <p className="display text-4xl font-black text-cyan-300">
              {dash?.stats?.apps_connected ?? 0}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="metal-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-cyan-300" />
              <h2 className="mono-label">Connect an app</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {APPS.map((a) => {
                const Icon = a.icon;
                const connected = dash?.connected_apps?.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => logHello(a.id)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      connected
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-slate-800 hover:border-cyan-400/40"
                    }`}
                    data-testid={`connect-app-${a.id}`}
                  >
                    <Icon className="w-4 h-4 text-cyan-300 mb-2" />
                    <p className="text-xs font-bold text-slate-200">{a.name}</p>
                    <p className="text-[10px] mono text-slate-500 mt-1">
                      {connected ? "Connected" : "Tap to connect"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="metal-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-cyan-300" />
              <h2 className="mono-label">Recent orders</h2>
            </div>
            {dash?.orders?.length ? (
              <ul className="space-y-2" data-testid="orders-list">
                {dash.orders.map((o) => (
                  <li
                    key={o.session_id}
                    className="flex items-center justify-between text-sm p-3 rounded-md bg-slate-900/60"
                  >
                    <div>
                      <p className="text-slate-200 font-semibold">
                        ${o.amount?.toFixed(2)}
                      </p>
                      <p className="mono text-[10px] text-slate-500">
                        {o.session_id?.slice(0, 24)}…
                      </p>
                    </div>
                    <span
                      className={`mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${
                        o.payment_status === "paid"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No orders yet.</p>
            )}
          </section>

          <section className="metal-border rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-cyan-300" />
              <h2 className="mono-label">Activity feed</h2>
            </div>
            {dash?.activity?.length ? (
              <ul className="space-y-2" data-testid="activity-list">
                {dash.activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 text-sm p-3 rounded-md bg-slate-900/60"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="mono text-[10px] uppercase tracking-widest text-cyan-300 w-24">
                      {a.app_id}
                    </span>
                    <span className="text-slate-200">{a.action}</span>
                    <span className="ml-auto text-[10px] mono text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No activity yet — connect an app above to get started.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
