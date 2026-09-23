import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export default function GuitarStage() {
  const [guitars, setGuitars] = useState([]);
  const { add } = useCart();

  useEffect(() => {
    api
      .get("/shop/products")
      .then((r) => setGuitars(r.data.filter((p) => p.category === "Signature Guitars")))
      .catch(() => {});
  }, []);

  if (!guitars.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-slate-800/80" data-testid="home-guitar-stage">
      <div className="absolute inset-0 jn-galaxy" style={{ "--jn-galaxy-img": "url(/jamnow/galaxy-bg.jpg)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="mono-label mb-3">Main Stage · Signature Guitars</p>
          <h2 className="display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
            The Flying‑Vs from the apps.{" "}
            <span className="text-cyan-300 text-glow-cyan">Real, playable, yours.</span>
          </h2>
          <p className="text-slate-300 mt-4">
            Three signature guitars built to the artwork inside GroovSesh. The Lightning V ships with
            GroovPuck Bluetooth built in — play wirelessly into GroovBox or any GroovLabz amp.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {guitars.map((g) => (
            <article
              key={g.id}
              className="group relative rounded-3xl metal-border overflow-hidden hover:border-cyan-400/70 transition-all flex flex-col"
              data-testid={`stage-guitar-${g.id}`}
            >
              <Link to={`/shop/${g.id}`} className="relative block aspect-[4/5] overflow-hidden" data-testid={`stage-guitar-link-${g.id}`}>
                <img
                  src={g.image}
                  alt={g.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/90 text-slate-950 font-bold">
                  {g.tag}
                </span>
              </Link>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="display text-xl sm:text-2xl font-black mb-2">
                  <Link to={`/shop/${g.id}`} className="hover:text-cyan-300 transition-colors">{g.name}</Link>
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">{g.description}</p>
                <ul className="space-y-1.5 mb-6">
                  {g.specs.slice(0, 3).map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3 h-3 text-cyan-300 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-4">
                  <span className="display text-3xl font-black text-cyan-300" data-testid={`stage-guitar-price-${g.id}`}>
                    ${g.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      add(g);
                      toast.success(`${g.name} added to cart`);
                    }}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm glow-cyan transition-all hover:scale-[1.03]"
                    data-testid={`stage-add-to-cart-${g.id}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <Link to="/shop" className="mono-label text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-2 mt-10" data-testid="stage-shop-link">
          See all hardware in the shop <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}
