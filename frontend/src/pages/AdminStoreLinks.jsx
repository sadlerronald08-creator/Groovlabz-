import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Save, ExternalLink, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { APPS } from "../data/apps";
import api, { formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useStoreLinks } from "../lib/storeLinks";

export default function AdminStoreLinks() {
  const { user, ready } = useAuth();
  const { links, refresh } = useStoreLinks();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const next = {};
    APPS.forEach((a) => (next[a.id] = { ios: links[a.id]?.ios || "", android: links[a.id]?.android || "" }));
    setForm(next);
  }, [links]);

  if (!ready) return null;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

  const save = async (id) => {
    setSaving(id);
    try {
      await api.put(`/admin/store-links/${id}`, form[id]);
      await refresh();
      toast.success("Store links saved");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="pt-24 pb-20" data-testid="admin-store-links-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/account" className="mono-label hover:text-cyan-200 mb-8 inline-block" data-testid="admin-back-link">← Account</Link>
        <p className="mono-label mb-3">Admin</p>
        <h1 className="display text-3xl sm:text-4xl font-black mb-3">App Store & Google Play links</h1>
        <p className="text-slate-400 mb-8 max-w-2xl">
          Paste each app's listing URL once it's approved. Badges across the site switch from the generic store pages to your listing instantly.
        </p>

        <div className="metal-border rounded-2xl p-5 mb-10 text-sm text-slate-300 space-y-2" data-testid="admin-store-help">
          <p className="flex items-start gap-2"><Info className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" /><span><strong className="text-slate-100">Apple:</strong> App Store Connect → your app → App Information → "View on App Store". Format <code className="mono text-cyan-300">https://apps.apple.com/us/app/groovsesh/id1234567890</code></span></p>
          <p className="flex items-start gap-2"><Info className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" /><span><strong className="text-slate-100">Google:</strong> Play Console → your app → the store URL uses your package name. Format <code className="mono text-cyan-300">https://play.google.com/store/apps/details?id=com.groovlabz.groovsesh</code></span></p>
        </div>

        <div className="space-y-6">
          {APPS.map((a) => (
            <section key={a.id} className="metal-border rounded-2xl p-6" data-testid={`admin-store-row-${a.id}`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="display text-xl font-extrabold">{a.name}</h2>
                {links[a.id]?.ios || links[a.id]?.android ? (
                  <span className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-widest text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Live links set</span>
                ) : (
                  <span className="mono text-[10px] uppercase tracking-widest text-slate-500">Using generic store pages</span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {["ios", "android"].map((k) => (
                  <div key={k}>
                    <label className="mono text-[11px] uppercase tracking-widest text-slate-400 mb-1 block">{k === "ios" ? "App Store URL" : "Google Play URL"}</label>
                    <div className="flex gap-2">
                      <input
                        value={form[a.id]?.[k] || ""}
                        onChange={(e) => setForm((f) => ({ ...f, [a.id]: { ...f[a.id], [k]: e.target.value } }))}
                        placeholder={k === "ios" ? "https://apps.apple.com/…" : "https://play.google.com/store/apps/details?id=…"}
                        className="flex-1 h-11 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100 text-sm"
                        data-testid={`store-input-${a.id}-${k}`}
                      />
                      {form[a.id]?.[k] && (
                        <a href={form[a.id][k]} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-lg metal-border flex items-center justify-center" aria-label="Open link">
                          <ExternalLink className="w-4 h-4 text-cyan-300" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => save(a.id)}
                disabled={saving === a.id}
                className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-sm glow-cyan"
                data-testid={`store-save-${a.id}`}
              >
                <Save className="w-4 h-4" /> {saving === a.id ? "Saving…" : "Save"}
              </button>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
