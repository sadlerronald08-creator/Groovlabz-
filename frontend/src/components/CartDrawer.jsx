import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import api, { formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

export default function CartDrawer() {
  const { items, remove, setQty, total, open, setOpen, count } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    if (!items.length) return;
    setLoading(true);
    try {
      const { data } = await api.post("/payments/checkout", {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
          data-testid="cart-backdrop"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] glass border-l border-cyan-500/20 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full invisible"
        }`}
        data-testid="cart-drawer"
        aria-hidden={!open}
      >
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-cyan-300" />
            <span className="mono-label text-cyan-300">Cart · {count}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-md metal-border flex items-center justify-center"
            data-testid="close-cart-button"
            aria-label="Close cart"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-190px)]">
          {items.length === 0 ? (
            <div className="text-center py-16" data-testid="cart-empty-state">
              <div className="w-16 h-16 rounded-full metal-border flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400">Cart is empty</p>
              <p className="text-xs text-slate-600 mt-2 mono">Add some gear from the Shop</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.product_id}
                  className="flex gap-3 metal-border rounded-lg p-3"
                  data-testid={`cart-item-${it.product_id}`}
                >
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 line-clamp-2">
                      {it.name}
                    </p>
                    <p className="text-cyan-300 font-bold mono mt-1">
                      ${it.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setQty(it.product_id, it.quantity - 1)}
                        className="w-7 h-7 rounded-md border border-slate-700 hover:border-cyan-400 text-slate-300 flex items-center justify-center"
                        data-testid={`cart-decr-${it.product_id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="mono text-sm text-slate-200 min-w-[24px] text-center">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() => setQty(it.product_id, it.quantity + 1)}
                        className="w-7 h-7 rounded-md border border-slate-700 hover:border-cyan-400 text-slate-300 flex items-center justify-center"
                        data-testid={`cart-incr-${it.product_id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => remove(it.product_id)}
                        className="ml-auto text-slate-500 hover:text-rose-400"
                        data-testid={`cart-remove-${it.product_id}`}
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-5 bg-slate-950/80">
          <div className="flex items-center justify-between mb-4">
            <span className="mono-label">Subtotal</span>
            <span
              className="display text-xl font-black text-cyan-300"
              data-testid="cart-subtotal"
            >
              ${total.toFixed(2)}
            </span>
          </div>
          <button
            disabled={!items.length || loading}
            onClick={checkout}
            className="w-full h-12 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold glow-cyan transition-all"
            data-testid="checkout-button"
          >
            {loading ? "Redirecting…" : user && user.id ? "Checkout" : "Checkout as Guest"}
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2 mono">
            Secured by Stripe · Test mode
          </p>
        </div>
      </aside>
    </>
  );
}
