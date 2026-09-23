import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gl_cart")) || [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("gl_cart", JSON.stringify(items));
  }, [items]);

  const add = (product, { openDrawer = true } = {}) => {
    setItems((cur) => {
      const found = cur.find((c) => c.product_id === product.id);
      if (found) {
        return cur.map((c) =>
          c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...cur,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ];
    });
    if (openDrawer) setOpen(true);
  };
  const remove = (pid) => setItems((cur) => cur.filter((c) => c.product_id !== pid));
  const setNote = (pid, gift_note) =>
    setItems((cur) => cur.map((c) => (c.product_id === pid ? { ...c, gift_note } : c)));
  const has = (pid) => items.some((c) => c.product_id === pid);
  const setQty = (pid, q) =>
    setItems((cur) =>
      cur
        .map((c) => (c.product_id === pid ? { ...c, quantity: Math.max(1, q) } : c))
        .filter((c) => c.quantity > 0)
    );
  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  return (
    <CartCtx.Provider
      value={{ items, add, remove, setQty, setNote, has, clear, total, count, open, setOpen }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
