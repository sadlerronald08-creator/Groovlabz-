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
            Two limited signature guitars, built to the exact artwork you see inside GroovSesh.
            Set up and ready to plug into your GroovPuck.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {guitars.map((g) => (
            <article
              key={g.id}
              className="group relative rounded-3xl metal-border overflow-hidden hover:border-cyan-400/70 transition-all"
              data-testid={`stage-guitar-${g.id}`}
            >
              <div className="grid grid-cols-[42%_1fr] gap-4 items-stretch">
                <div className="relative min-h-[380px] flex items-center justify-center p-4">
                  <div className="absolute inset-6 rounded-full blur-3xl opacity-40 bg-gradient-to-b from-[#2DA4FF] via-[#C978FF] to-transparent" />
                  <img
                    src={g.image}
                    alt={g.name}
                    className="relative h-[360px] w-auto object-contain drop-shadow-[0_0_30px_rgba(45,164,255,0.6)] transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2"
                  />
                </div>
                <div className="py-8 pr-8 flex flex-col">
                  <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 self-start mb-4">
                    {g.tag} · Limited
                  </span>
                  <h3 className="display text-2xl sm:text-3xl font-black mb-2">{g.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{g.description}</p>
                  <ul className="space-y-1.5 mb-6">
                    {g.specs.map((s) => (
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
                      Add to cart
                    </button>
                  </div>
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
