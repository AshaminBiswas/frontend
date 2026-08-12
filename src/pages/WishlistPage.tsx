import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ShoppingCart, Trash2, ArrowRight, Package,
  Star, ShieldCheck, Truck, RotateCcw, Check, Sparkles
} from "lucide-react";
import { Product } from "../types";
import {
  SUPER_SAVER_PRODUCTS,
  VALUE_MONEY_PRODUCTS,
  BEST_SELLER_PRODUCTS,
} from "../data/products";

// Deduplicated master catalog
const ALL_PRODUCTS: Product[] = Array.from(
  new Map(
    [
      ...SUPER_SAVER_PRODUCTS,
      ...VALUE_MONEY_PRODUCTS,
      ...BEST_SELLER_PRODUCTS,
    ].map((p) => [p.id, p])
  ).values()
);

/* ── Safe Product Thumbnail with Image Fallback ── */
function WishlistThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-44 sm:h-52 bg-gradient-to-br from-[#EACEAA] to-[#D39858]/30 flex items-center justify-center border-b border-[#34150F]/8">
        <Package size={32} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <div className="w-full h-44 sm:h-52 overflow-hidden bg-[#EACEAA]/20 border-b border-[#34150F]/8 relative group">
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

interface WishlistPageProps {
  wishlist: Set<number | string>;
  wishlistItems?: Product[];
  onToggleWishlist: (productOrId: Product | number | string) => void;
  onAddToCart: (product: Product) => void;
}

export function WishlistPage({
  wishlist,
  wishlistItems = [],
  onToggleWishlist,
  onAddToCart,
}: WishlistPageProps) {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Filter wishlisted items from saved items list & static catalog
  const wishlistedItems = useMemo(() => {
    const listMap = new Map<string, Product>();

    // 1. Saved dynamic API / catalog items from hook
    (wishlistItems || []).forEach((item) => {
      const key = String(item.apiId || item.id);
      listMap.set(key, item);
    });

    // 2. Static catalog items matching wishlist set
    ALL_PRODUCTS.forEach((p) => {
      const pKey = String(p.apiId || p.id);
      const isSaved =
        wishlist.has(p.id) ||
        wishlist.has(pKey) ||
        (p.apiId && wishlist.has(p.apiId));
      if (isSaved && !listMap.has(pKey)) {
        listMap.set(pKey, p);
      }
    });

    return Array.from(listMap.values());
  }, [wishlist, wishlistItems]);

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const handleAddAllToCart = () => {
    wishlistedItems.forEach((item) => onAddToCart(item));
  };

  /* ── Empty State ── */
  if (wishlistedItems.length === 0) {
    return (
      <div
        className="min-h-screen bg-[#EACEAA] flex items-center justify-center px-4 py-16"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-[#34150F] rounded-tr-3xl rounded-bl-3xl flex items-center justify-center mx-auto mb-6 shadow-xl relative">
            <Heart size={42} className="text-[#D39858] fill-[#D39858]/30" />
            <Sparkles size={18} className="text-[#D39858] absolute top-3 right-3 animate-pulse" />
          </div>
          <h1
            className="text-3xl font-bold text-[#34150F] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Your Wishlist is Empty
          </h1>
          <p className="text-[#85431E] text-sm mb-8 leading-relaxed">
            Save items you love by tapping the heart icon while browsing our collection of premium architectural hardware.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all text-sm shadow-md active:scale-95"
          >
            Explore Catalog <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#EACEAA] px-4 py-8 md:px-8 lg:px-16"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#34150F] rounded-tr-xl rounded-bl-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart size={22} className="text-[#D39858] fill-[#D39858]" />
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-[#34150F] leading-tight"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                My Saved Wishlist
              </h1>
              <p className="text-xs text-[#85431E] mt-0.5">
                {wishlistedItems.length} product{wishlistedItems.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all text-xs shadow-md active:scale-95"
            >
              <ShoppingCart size={14} /> Add All to Cart
            </button>
            <Link
              to="/products"
              className="text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors hidden sm:block"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── Responsive Wishlist Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
          {wishlistedItems.map((product) => {
            const isAdded = addedIds.has(product.id);
            const discountPercent =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : product.discount || 0;

            return (
              <div
                key={product.id}
                className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative">
                    <WishlistThumb src={product.image} name={product.name} />

                    {/* Remove from Wishlist button */}
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all"
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-[#D39858] text-[#34150F] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-tr-lg rounded-bl-lg shadow">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    {product.category && (
                      <span className="inline-block text-[9px] font-bold text-[#85431E]/70 uppercase tracking-wider mb-1">
                        {typeof product.category === 'object' ? (product.category as any).name : product.category}
                      </span>
                    )}

                    <Link to={`/product/${product.apiId || product.id}`}>
                      <h3 className="text-sm font-bold text-[#34150F] leading-snug line-clamp-2 hover:text-[#D39858] transition-colors mb-2">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            fill={s <= (product.rating || 5) ? "#D39858" : "none"}
                            stroke="#D39858"
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#85431E]/60 font-semibold">
                        ({product.rating || 5}.0)
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-lg font-black text-[#34150F]"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-[#85431E]/50 line-through">
                          ₹{product.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add to Cart CTA */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-2.5 px-4 rounded-tr-xl rounded-bl-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 ${
                      isAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} /> Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[rgba(52,21,15,0.1)]">
          <div className="flex items-center gap-3 bg-[#f5e8d4] p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.07)]">
            <Truck size={22} className="text-[#D39858] flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#34150F]">Free Shipping</p>
              <p className="text-[10px] text-[#85431E]/70">On orders above ₹2,000 pan-India</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#f5e8d4] p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.07)]">
            <ShieldCheck size={22} className="text-[#D39858] flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#34150F]">Quality Guaranteed</p>
              <p className="text-[10px] text-[#85431E]/70">Certified hardware from top brands</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#f5e8d4] p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.07)]">
            <RotateCcw size={22} className="text-[#D39858] flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#34150F]">7-Day Returns</p>
              <p className="text-[10px] text-[#85431E]/70">Easy return & refund policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
