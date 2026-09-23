import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ShoppingBag, Maximize2, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useCart } from "../lib/cart";
import Lightbox from "../components/Lightbox";
import Reviews from "../components/Reviews";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [active, setActive] = useState(0);
  const [lb, setLb] = useState(null);

  useEffect(() => {
    setP(null);
    setActive(0);
    window.scrollTo(0, 0);
    api
      .get(`/shop/products/${id}`)
      .then((r) => setP(r.data))
      .catch(() => navigate("/shop", { replace: true }));
    api.get("/shop/products").then((r) => setRelated(r.data)).catch(() => {});
  }, [id, navigate]);

  if (!p) return <div className="pt-40 text-center mono-label" data-testid="product-loading">Loading…</div>;

  const gallery = p.gallery || [{ src: p.image, label: p.name }];
  const others = related.filter((x) => x.id !== p.id && x.category === p.category && x.kind !== "bundle").slice(0, 3);

  return (
    <div className="pt-24 pb-20" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/shop" className="mono-label inline-flex items-center gap-2 hover:text-cyan-200 mb-10" data-testid="product-back-link">
          <ArrowLeft className="w-3 h-3" /> Back to shop
        </Link>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <button
              onClick={() => setLb(active)}
              className="group relative w-full rounded-3xl metal-border overflow-hidden aspect-[4/5] sm:aspect-[5/5] block"
              data-testid="product-main-image"
            >
              <img src={gallery[active].src} alt={gallery[active].label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 h-9 px-3 rounded-full glass text-xs text-cyan-200">
                <Maximize2 className="w-3.5 h-3.5" /> View full size
              </span>
            </button>
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4" data-testid="product-gallery">
                {gallery.map((g, i) => (
                  <button
                    key={g.src}
                    onClick={() => setActive(i)}
                    className={`rounded-xl overflow-hidden aspect-square border transition-all ${i === active ? "border-cyan-400 glow-cyan" : "border-slate-800 hover:border-cyan-400/50"}`}
                    data-testid={`product-thumb-${i}`}
                  >
                    <img src={g.src} alt={g.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              {p.tag}
            </span>
            <p className="mono-label mt-5 mb-2">{p.category}</p>
            <h1 className="display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4" data-testid="product-name">{p.name}</h1>
            <p className="text-slate-300 leading-relaxed mb-6">{p.description}</p>

            <div className="flex items-center justify-between gap-4 metal-border rounded-2xl p-5 mb-6">
              <span className="display text-4xl font-black text-cyan-300" data-testid="product-price">${p.price.toFixed(2)}</span>
              <button
                onClick={() => { add(p); toast.success(`${p.name} added to cart`); }}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan transition-all hover:scale-[1.03]"
                data-testid="product-add-to-cart"
              >
                <ShoppingBag className="w-4 h-4" /> Add to cart
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-8">
              <span className="inline-flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-300" /> Free shipping over $99</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-300" /> 2‑year GroovLabz warranty</span>
            </div>

            {p.includes && (
              <div className="metal-border rounded-2xl p-5 mb-8" data-testid="product-includes">
                <p className="mono-label mb-3">This kit includes</p>
                <ul className="space-y-2">
                  {p.includes.map((iid) => {
                    const inc = related.find((x) => x.id === iid);
                    return inc ? (
                      <li key={iid} className="flex items-center gap-3">
                        <img src={inc.image} alt={inc.name} className="w-10 h-10 rounded-lg object-cover" />
                        <Link to={`/shop/${inc.id}`} className="text-sm text-slate-200 hover:text-cyan-300 flex-1">{inc.name}</Link>
                        <span className="mono text-xs text-slate-500">${inc.price.toFixed(2)}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
                <p className="mono text-xs text-slate-500 mt-3">Separately ${p.full_price.toFixed(2)} · you save ${(p.full_price - p.price).toFixed(2)}</p>
              </div>
            )}

            <ul className="space-y-2.5 mb-8">
              {p.specs.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-cyan-300" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>

            {p.sheet && (
              <div className="metal-border rounded-2xl overflow-hidden" data-testid="product-spec-sheet">
                <div className="px-5 py-3 border-b border-slate-800 mono-label">Spec sheet</div>
                <dl>
                  {Object.entries(p.sheet).map(([k, v], i) => (
                    <div key={k} className={`grid grid-cols-[110px_1fr] gap-3 px-5 py-2.5 text-sm ${i % 2 ? "" : "bg-slate-900/40"}`}>
                      <dt className="mono text-[11px] uppercase tracking-wider text-slate-500 pt-0.5">{k}</dt>
                      <dd className="text-slate-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {others.length > 0 && (
          <div className="mt-24">
            <p className="mono-label mb-3">More {p.category}</p>
            <div className="grid sm:grid-cols-3 gap-6" data-testid="product-related">
              {others.map((o) => (
                <Link key={o.id} to={`/shop/${o.id}`} className="group metal-border rounded-2xl overflow-hidden hover:border-cyan-400/60 transition-all" data-testid={`related-${o.id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img src={o.image} alt={o.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <h3 className="display text-sm font-extrabold">{o.name}</h3>
                    <span className="display text-cyan-300 font-black">${o.price.toFixed(0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Reviews productId={p.id} />
      </div>

      {lb !== null && <Lightbox images={gallery} index={lb} onClose={() => setLb(null)} onChange={setLb} />}
    </div>
  );
}
