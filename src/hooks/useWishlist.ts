import { useState, useEffect } from "react";
import { Product } from "../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../data/products";

const ALL_STATIC_PRODUCTS: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

export function useWishlist() {
  // Set storing saved product IDs (both numeric and string forms)
  const [wishlist, setWishlist] = useState<Set<number | string>>(() => {
    try {
      const saved = localStorage.getItem("prc_wishlist");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Array of full Product objects saved in wishlist
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    try {
      const savedMap = localStorage.getItem("prc_wishlist_items");
      if (savedMap) {
        return JSON.parse(savedMap);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("prc_wishlist", JSON.stringify(Array.from(wishlist)));
      localStorage.setItem("prc_wishlist_items", JSON.stringify(wishlistItems));
    } catch {}
  }, [wishlist, wishlistItems]);

  const toggleWishlist = (productOrId: Product | number | string) => {
    let targetId: number | string;
    let targetProduct: Product | undefined = undefined;

    if (typeof productOrId === "object" && productOrId !== null) {
      targetProduct = productOrId;
      targetId = productOrId.apiId || productOrId.id;
    } else {
      targetId = productOrId;
      targetProduct = ALL_STATIC_PRODUCTS.find(
        (p) => String(p.id) === String(targetId) || String((p as any).apiId) === String(targetId)
      );
    }

    const strTargetId = String(targetId);
    const numTargetId = typeof targetId === "number" ? targetId : parseInt(strTargetId.replace(/\D/g, ""), 10);

    // Fallback if targetProduct is not found in static catalog
    if (!targetProduct && targetId) {
      targetProduct = {
        id: !isNaN(numTargetId) ? numTargetId : Math.floor(Math.random() * 900000) + 100000,
        apiId: strTargetId,
        name: `Architectural Hardware Item #${strTargetId.slice(-4)}`,
        price: 499,
        originalPrice: 699,
        discount: 28,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
        category: "Architectural Hardware",
      };
    }

    setWishlist((prev) => {
      const next = new Set(prev);
      const isAlreadySaved = next.has(targetId) || next.has(strTargetId) || (!isNaN(numTargetId) && next.has(numTargetId));

      if (isAlreadySaved) {
        next.delete(targetId);
        next.delete(strTargetId);
        if (!isNaN(numTargetId)) next.delete(numTargetId);
      } else {
        next.add(targetId);
        if (strTargetId) next.add(strTargetId);
        if (!isNaN(numTargetId)) next.add(numTargetId);
      }
      return next;
    });

    setWishlistItems((prev) => {
      const isAlreadyInList = prev.some(
        (item) => String(item.id) === strTargetId || String(item.apiId || '') === strTargetId
      );

      if (isAlreadyInList) {
        return prev.filter(
          (item) => String(item.id) !== strTargetId && String(item.apiId || '') !== strTargetId
        );
      } else if (targetProduct) {
        return [...prev, targetProduct];
      }
      return prev;
    });
  };

  const isWishlisted = (productOrId: Product | number | string): boolean => {
    let targetId: number | string;
    if (typeof productOrId === "object" && productOrId !== null) {
      targetId = productOrId.apiId || productOrId.id;
    } else {
      targetId = productOrId;
    }
    const strTargetId = String(targetId);
    const numTargetId = typeof targetId === "number" ? targetId : parseInt(strTargetId.replace(/\D/g, ""), 10);

    return (
      wishlist.has(targetId) ||
      wishlist.has(strTargetId) ||
      (!isNaN(numTargetId) && wishlist.has(numTargetId)) ||
      wishlistItems.some(item => String(item.id) === strTargetId || String(item.apiId || '') === strTargetId)
    );
  };

  return {
    wishlist,
    wishlistItems,
    toggleWishlist,
    isWishlisted,
    wishlistCount: wishlistItems.length,
  };
}
