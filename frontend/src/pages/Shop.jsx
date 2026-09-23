import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../lib/cart";
import { toast } from "sonner";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const { add } = useCart();

  useEffect(() => {
    api.get("/shop/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const categories = ["all", ...new Set(products.map((p) => p.category))];
  const filtered = filter === "all" ? products : products.filter((p) => p.category === filter);

  return (
    <div className="pt-24 pb-16" data-testid="shop-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mono-label mb-3">The Shop</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Hardware built for the <span className="text-cyan-300">GroovLabz signal chain.</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Signature Flying‑V guitars, Bluetooth guitar transceivers, MIDI foot
            controllers, reference headphones, and studio essentials. Free shipping over $99.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-8" role="tablist">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`h-9 px-4 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                filter === c
                  ? "bg-cyan-400 text-slate-950 glow-cyan"
                  : "metal-border text-slate-300 hover:border-cyan-400/50"
              }`}
              data-testid={`shop-filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {c === "all" ? "All Gear" : c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="metal-border rounded-2xl overflow-hidden hover:border-cyan-400/60 transition-all group"
              data-testid={`shop-product-${p.id}`}
            >
              <Link to={`/shop/${p.id}`} className="relative aspect-square overflow-hidden bg-slate-900 block" data-testid={`shop-product-link-${p.id}`}>
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/90 text-slate-950 font-bold">
                  {p.tag}
                </span>
              </Link>
              <div className="p-5">
                <p className="mono-label mb-2">{p.category}</p>
                <h3 className="display text-xl font-extrabold mb-2">
                  <Link to={`/shop/${p.id}`} className="hover:text-cyan-300 transition-colors">{p.name}</Link>
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {p.description}
                </p>
                <ul className="space-y-1.5 mb-5">
                  {p.specs.slice(0, 3).map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3 h-3 text-cyan-300 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  <span className="display text-2xl font-black text-cyan-300">
                    ${p.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      add(p);
                      toast.success(`${p.name} added to cart`);
                    }}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm glow-cyan transition-all"
                    data-testid={`add-to-cart-${p.id}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
