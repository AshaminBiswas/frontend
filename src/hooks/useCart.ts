import { useState, useEffect } from "react";
import { Product, CartItem } from "../types";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("prc_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("prc_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const matchId = (item: CartItem) =>
        String(item.id) === String(product.id) ||
        (Boolean(item.apiId) && Boolean(product.apiId) && String(item.apiId) === String(product.apiId));

      const existing = prev.find(matchId);
      if (existing) {
        return prev.map((i) => (matchId(i) ? { ...i, qty: i.qty + Math.max(1, qty) } : i));
      }
      return [
        ...prev,
        {
          ...product,
          apiId: (product as any).apiId || (product as any)._id || (typeof product.id === "string" ? product.id : undefined),
          qty: Math.max(1, qty),
        },
      ];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((i) => String(i.id) !== String(id) && String(i.apiId || "") !== String(id)));
  };

  const changeQty = (id: number | string, delta: number) => {
    setCart((prev) =>
      prev.map((i) =>
        String(i.id) === String(id) || String(i.apiId || "") === String(id)
          ? { ...i, qty: Math.max(1, i.qty + delta) }
          : i
      )
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return {
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    changeQty,
    cartCount,
    cartTotal,
  };
}
