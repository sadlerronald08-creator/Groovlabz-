import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Upload, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail, mediaUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { APPS } from "../data/apps";
import { refreshMediaOverrides, useMediaOverrides } from "../lib/media";

function MediaRow({ kind, id, name, current }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const overrides = useMediaOverrides();
  const override = overrides[`${kind}:${id}`];

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.put(`/admin/media/${kind}/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshMediaOverrides();
      toast.success(`${name} updated`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/media/${kind}/${id}`);
      await refreshMediaOverrides();
      toast.success(`${name} reset to default`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4 metal-border rounded-xl p-3" data-testid={`media-row-${kind}-${id}`}>
      <img src={override || mediaUrl(current)} alt={name} className={`rounded-lg object-cover bg-slate-900 ${kind === "app" ? "w-12 h-20" : "w-16 h-16"}`} data-testid={`media-preview-${kind}-${id}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className="mono text-[10px] uppercase tracking-widest text-slate-500">{override ? "Custom upload" : "Default image"}</p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} data-testid={`media-input-${kind}-${id}`} />
      <button onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-cyan-400 text-slate-950 text-xs font-bold disabled:opacity-50" data-testid={`media-upload-${kind}-${id}`}>
        <Upload className="w-3.5 h-3.5" /> {busy ? "…" : "Replace"}
      </button>
      {override && (
        <button onClick={reset} disabled={busy} className="inline-flex items-center gap-2 h-9 px-3 rounded-full metal-border text-slate-300 text-xs" data-testid={`media-reset-${kind}-${id}`}>
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      )}
    </div>
  );
}

export default function AdminMedia() {
  const { user, ready } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/shop/products").then((r) => setProducts(r.data.filter((p) => p.kind !== "bundle"))).catch(() => {});
  }, []);

  if (!ready) return null;
  if (!user || !user.id || user.role !== "admin") return <Navigate to="/login" replace />;

  return (
    <div className="pt-24 pb-16" data-testid="admin-media-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/account" className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-300 mb-6" data-testid="admin-media-back">
          <ArrowLeft className="w-3.5 h-3.5" /> Account
        </Link>
        <p className="mono-label mb-2">Admin</p>
        <h1 className="display text-3xl sm:text-4xl font-black mb-3">Photos & screens</h1>
        <p className="text-slate-400 mb-10 max-w-2xl">Replace any product photo or app interface screen. Uploads go to secure storage and show on the site instantly. JPG / PNG / WEBP up to 10 MB.</p>

        <section className="mb-12">
          <h2 className="display text-xl font-extrabold mb-4">App interface screens</h2>
          <div className="space-y-3" data-testid="media-apps">
            {APPS.map((a) => <MediaRow key={a.id} kind="app" id={a.id} name={a.name} current={a.artwork} />)}
          </div>
        </section>

        <section>
          <h2 className="display text-xl font-extrabold mb-4">Product photos</h2>
          <div className="space-y-3" data-testid="media-products">
            {products.map((p) => <MediaRow key={p.id} kind="product" id={p.id} name={p.name} current={p.image} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
