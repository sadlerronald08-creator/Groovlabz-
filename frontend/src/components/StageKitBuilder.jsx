import { useEffect, useMemo, useState } from "react";
import { Zap, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export default function StageKitBuilder({ compact = false }) {
  const [products, setProducts] = useState([]);
  const [guitar, setGuitar] = useState("lightning-v");
  const [strings, setStrings] = useState("strings-blue");
  const { add } = useCart();

  useEffect(() => {
    api.get("/shop/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const guitars = products.filter((p) => p.category === "Signature Guitars");
  const stringSets = products.filter((p) => p.category === "Strings");
  const amp = products.find((p) => p.id === "groovamp-12");
  const kit = useMemo(() => products.find((p) => p.id === `kit-${guitar}-${strings}`), [products, guitar, strings]);

  if (!kit || !amp) return null;
  const g = guitars.find((p) => p.id === guitar);
  const s = stringSets.find((p) => p.id === strings);
  const colorOf = (p) => p.name.split("—")[1].split("(")[0].trim();
  const swatch = { "strings-green": "#39FF14", "strings-purple": "#B026FF", "strings-blue": "#2DA4FF" };

  return (
    <section className={`relative rounded-3xl metal-border overflow-hidden ${compact ? "p-6" : "p-6 sm:p-10"}`} data-testid="stage-kit-builder">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-25" style={{ background: swatch[strings] }} />
      <div className="relative grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-300" />
            <p className="mono-label">Stage Kit · Save 15%</p>
          </div>
          <h2 className={`display font-black leading-tight mb-3 ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
            Guitar + amp + neon strings. <span className="text-cyan-300">One tap.</span>
          </h2>
          <p className="text-slate-400 text-sm mb-6">Pick your Flying‑V and string color — the GroovAmp 12 is included. Everything ships together, set up and ready.</p>

          <p className="mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">Guitar</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {guitars.map((p) => (
              <button
                key={p.id}
                onClick={() => setGuitar(p.id)}
                className={`h-9 px-4 rounded-full text-sm font-semibold transition-all ${guitar === p.id ? "bg-cyan-400 text-slate-950 glow-cyan" : "metal-border text-slate-300 hover:border-cyan-400/50"}`}
                data-testid={`kit-guitar-${p.id}`}
              >
                {p.name.replace("GroovLabz ", "")}
              </button>
            ))}
          </div>
          <p className="mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">Neon strings</p>
          <div className="flex gap-3 mb-8">
            {stringSets.map((p) => (
              <button
                key={p.id}
                onClick={() => setStrings(p.id)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${strings === p.id ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                style={{ background: swatch[p.id], boxShadow: strings === p.id ? `0 0 18px ${swatch[p.id]}` : "none" }}
                aria-label={colorOf(p)}
                title={colorOf(p)}
                data-testid={`kit-strings-${p.id}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <p className="mono text-xs text-slate-500 line-through" data-testid="kit-full-price">${kit.full_price.toFixed(2)}</p>
              <p className="display text-4xl font-black text-cyan-300" data-testid="kit-price">${kit.price.toFixed(2)}</p>
            </div>
            <button
              onClick={() => { add(kit); toast.success("Stage Kit added to cart"); }}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan transition-all hover:scale-[1.03]"
              data-testid="kit-add-to-cart"
            >
              <ShoppingBag className="w-4 h-4" /> Add Stage Kit
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-3 gap-3" data-testid="kit-includes">
          {[g, amp, s].map((p, i) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden metal-border">
              <div className={`${i === 0 ? "aspect-[4/5]" : "aspect-[4/5]"} overflow-hidden`}>
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                <p className="text-xs font-bold text-slate-100 leading-tight">{p.name.replace("GroovLabz ", "")}</p>
                <p className="mono text-[10px] text-cyan-300 mt-1 inline-flex items-center gap-1"><Check className="w-3 h-3" /> ${p.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
