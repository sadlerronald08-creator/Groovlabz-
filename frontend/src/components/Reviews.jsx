import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, BadgeCheck, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";

const API = process.env.REACT_APP_BACKEND_URL;

function Stars({ value, onChange, size = "w-4 h-4" }) {
  return (
    <div className="flex gap-0.5" data-testid="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "hover:scale-110 transition-transform" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          data-testid={onChange ? `rating-star-${n}` : undefined}
        >
          <Star className={`${size} ${n <= value ? "text-cyan-300 fill-cyan-300" : "text-slate-700"}`} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews({ productId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], count: 0, average: null });
  const [perm, setPerm] = useState(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get(`/shop/products/${productId}/reviews`).then((r) => setData(r.data)).catch(() => {});

  useEffect(() => {
    load();
    setPerm(null);
    if (user) api.get(`/shop/products/${productId}/can-review`).then((r) => setPerm(r.data)).catch(() => setPerm(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/uploads/review-photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPhoto(r.data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/shop/products/${productId}/reviews`, { rating, title, body, photo_id: photo?.id || null });
      toast.success("Thanks for your review!");
      setTitle(""); setBody(""); setPhoto(null); setRating(5);
      setPerm((p) => ({ ...p, can_review: false, already_reviewed: true }));
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not post review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-24" data-testid="reviews-section">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="mono-label mb-2">Verified reviews</p>
          <h2 className="display text-2xl sm:text-3xl font-black">What players say</h2>
        </div>
        <div className="flex items-center gap-3" data-testid="reviews-summary">
          <Stars value={Math.round(data.average || 0)} size="w-5 h-5" />
          <span className="display text-2xl font-black text-cyan-300">{data.average ?? "–"}</span>
          <span className="mono text-xs text-slate-500">{data.count} review{data.count === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {data.reviews.length === 0 && (
            <p className="text-slate-500 text-sm metal-border rounded-2xl p-6" data-testid="reviews-empty">No reviews yet — verified buyers can be the first.</p>
          )}
          {data.reviews.map((r) => (
            <article key={r.id} className="metal-border rounded-2xl p-5" data-testid={`review-${r.id}`}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Stars value={r.rating} />
                  <h3 className="display font-extrabold mt-2">{r.title}</h3>
                </div>
                <span className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-widest text-emerald-300">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified buyer
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{r.body}</p>
              {r.photo_url && (
                <img src={`${API}${r.photo_url}`} alt="Customer photo" className="mt-4 w-40 h-40 object-cover rounded-xl border border-slate-800" data-testid="review-photo" />
              )}
              <p className="mono text-[10px] text-slate-500 mt-3">{r.author} · {new Date(r.created_at).toLocaleDateString()}</p>
            </article>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="metal-border rounded-2xl p-6 sticky top-24" data-testid="review-form-card">
            {!user && (
              <p className="text-sm text-slate-400" data-testid="review-login-prompt">
                <Link to="/login" className="text-cyan-300 hover:text-cyan-200">Sign in</Link> to review this product. Only verified buyers can post.
              </p>
            )}
            {user && perm && !perm.purchased && (
              <p className="text-sm text-slate-400" data-testid="review-not-purchased">Reviews are open to verified buyers. Order this product and come back to share your take.</p>
            )}
            {user && perm?.already_reviewed && (
              <p className="text-sm text-emerald-300" data-testid="review-already">You've reviewed this product — thank you!</p>
            )}
            {user && perm?.can_review && (
              <form onSubmit={submit} className="space-y-4" data-testid="review-form">
                <p className="mono-label">Write a review</p>
                <Stars value={rating} onChange={setRating} size="w-7 h-7" />
                <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="Title"
                  className="w-full h-11 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100" data-testid="review-title-input" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} rows={4} placeholder="How does it play? Tone, feel, build…"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100 text-sm" data-testid="review-body-input" />
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} data-testid="review-photo-input" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full metal-border text-sm text-slate-200 hover:border-cyan-400/60 disabled:opacity-50" data-testid="review-photo-button">
                    <ImagePlus className="w-4 h-4 text-cyan-300" /> {uploading ? "Uploading…" : photo ? "Change photo" : "Add a photo"}
                  </button>
                  {photo && (
                    <div className="relative">
                      <img src={`${API}${photo.url}`} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-700" data-testid="review-photo-preview" />
                      <button type="button" onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center" aria-label="Remove photo">
                        <X className="w-3 h-3 text-slate-300" />
                      </button>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={saving || uploading}
                  className="w-full h-11 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold glow-cyan" data-testid="review-submit-button">
                  {saving ? "Posting…" : "Post review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
