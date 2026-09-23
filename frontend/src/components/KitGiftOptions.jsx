import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export default function KitGiftOptions({ item }) {
  const { add, remove, has, setNote } = useCart();
  const [bag, setBag] = useState(null);
  const wrapped = has("gigbag");

  useEffect(() => {
    api.get("/shop/products/gigbag").then((r) => setBag(r.data)).catch(() => {});
  }, []);

  if (!bag) return null;
  return (
    <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 space-y-2" data-testid={`kit-gift-${item.product_id}`}>
      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={wrapped}
          onChange={(e) => (e.target.checked ? add(bag, { openDrawer: false }) : remove("gigbag"))}
          className="accent-cyan-400 w-4 h-4"
          data-testid={`kit-gigbag-toggle-${item.product_id}`}
        />
        <Gift className="w-3.5 h-3.5 text-cyan-300" />
        Gift wrap in a GroovLabz gig bag <span className="mono text-cyan-300">+${bag.price.toFixed(2)}</span>
      </label>
      <textarea
        value={item.gift_note || ""}
        onChange={(e) => setNote(item.product_id, e.target.value.slice(0, 300))}
        rows={2}
        placeholder="Gift note (printed on a card inside the kit)"
        className="w-full text-xs px-3 py-2 rounded-md bg-slate-900/70 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
        data-testid={`kit-gift-note-${item.product_id}`}
      />
    </div>
  );
}
