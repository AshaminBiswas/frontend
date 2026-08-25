import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Check, Package, Eye, Star } from "lucide-react";
import { Product } from "../../types";
import { QuickViewModal } from "./QuickViewModal";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import { getProductStockStatus } from "../../utils/stock";

interface SingleProductCardProps {
  product: Product;
  onAddToCart: (p: Product, qty?: number) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlisted: boolean;
  className?: string;
}

function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-full min-h-[260px] bg-gradient-to-br from-[#34150F]/20 via-[#D39858]/10 to-[#85431E]/20 flex items-center justify-center rounded-tr-2xl rounded-bl-2xl">
        <Package size={48} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      loading="lazy"
      decoding="async"
      className="w-full h-full max-h-[360px] object-cover rounded-tr-2xl rounded-bl-2xl transition-transform duration-500 hover:scale-105"
    />
  );
}

export function SingleProductCard({
  product,
  onAddToCart,
  onWishlist,
  wishlisted,
  className = "",
}: SingleProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [quickView, setQuickView] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const effective = getEffectivePrice(product, user, qty, b2bCache);

  // 1. Stock Status Logic from shared utility
  const stockInfo = getProductStockStatus(product.stock, (product as any).reorderLevel, (product as any).inStock);

  // 2. Images Array
  const galleryImages: string[] = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images
    : (product.thumbnail || product.image ? [product.thumbnail || product.image] : []);

  const imageSrc = galleryImages[activeImgIdx] || product.thumbnail || product.image;

  // 3. Pricing Priority: Prioritize B2B calculated tier rate when user is B2B
  const salePrice = effective.isB2B
    ? effective.unitPrice
    : Number((product as any).salePrice ?? (product as any).offerPrice ?? effective.unitPrice ?? product.price ?? 0);

  let regularPrice = effective.isB2B
    ? effective.originalPrice
    : Number(
        product.originalPrice ||
        (product as any).regularPrice ||
        (product as any).mrp ||
        (product as any).price ||
        salePrice
      );

  if (!effective.isB2B && regularPrice <= salePrice && product.discount && product.discount > 0) {
    regularPrice = Math.round(salePrice / (1 - product.discount / 100));
  }

  const hasDiscount = regularPrice > salePrice;
  const discountPercent = effective.isB2B
    ? effective.b2bDiscountPercent
    : (hasDiscount ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : (product.discount || 0));

  // 4. Fields
  const categoryName = typeof product.category === 'object' && product.category !== null
    ? (product.category as any).name || "Hardware"
    : String(product.category || "Hardware");

  const materialText = typeof product.material === 'object' && product.material !== null
    ? String((product.material as any).name || "Solid Brass / Stainless Steel")
    : String(product.material || (product as any).finish || "Solid Brass / Stainless Steel");

  const shortDescriptionText =
    (product as any).shortDesc ||
    product.shortDesc ||
    (typeof product.description === "string" ? product.description : "");

  const handleNavigateToDetail = () => {
    const targetId = (product as any).apiId || product.id;
    navigate(`/product/${targetId}`);
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!stockInfo.isAvailable) return;
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onWishlist(product);
  };

  return (
    <>
      <div
        className={`w-full bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-3 sm:p-5 md:p-6 border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 ${className}`}
      >
        {/* Left Column: Image with Gallery */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div
            onClick={handleNavigateToDetail}
            className="relative w-full aspect-square max-h-[280px] sm:max-h-[360px] overflow-hidden rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl bg-[#EACEAA]/30 border border-[#34150F]/10 cursor-pointer group mb-2.5"
          >
            <ProductThumb src={imageSrc} name={product.name} />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#34150F] text-[#D39858] text-[8px] sm:text-[10px] font-black px-2 py-0.5 sm:py-1 rounded-tr-md rounded-bl-md shadow border border-[#D39858]/30">
                {discountPercent}% OFF
              </span>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleWishlist}
              className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                wishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-[#34150F]/80 text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
              }`}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={14} className={wishlisted ? "fill-white" : ""} />
            </button>

            {/* Quick View Hover Button (Desktop only) */}
            <div className="hidden sm:flex absolute inset-0 bg-[#34150F]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickView(true);
                }}
                className="flex items-center gap-1.5 bg-[#EACEAA] text-[#34150F] text-xs font-black px-3.5 py-1.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-colors shadow-lg active:scale-95"
              >
                <Eye size={13} /> Quick View
              </button>
            </div>
          </div>

          {/* Thumbnail Selector (if multiple images) */}
          {galleryImages.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-tr-md rounded-bl-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImgIdx === idx ? "border-[#D39858] scale-105 shadow-xs" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Product Info & CTAs */}
        <div className="md:col-span-7 flex flex-col justify-between h-full">
          <div>
            {/* Category & Stock Status Row */}
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#85431E] bg-[#EACEAA]/60 px-2.5 py-0.5 rounded-full border border-[rgba(52,21,15,0.08)]">
                {categoryName}
              </span>

              {/* Dynamic Stock Status Badge */}
              <span className={`text-[8px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${stockInfo.badgeClass}`}>
                {stockInfo.label}
              </span>
            </div>

            {/* Product Title */}
            <h3
              onClick={handleNavigateToDetail}
              className="text-base sm:text-lg md:text-xl font-bold text-[#34150F] leading-snug mb-1 cursor-pointer hover:text-[#D39858] transition-colors"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              {product.name}
            </h3>

            {/* Material & Star Rating */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-semibold text-[#85431E] bg-[#34150F]/10 px-2 py-0.5 rounded-full">
                {materialText}
              </span>

              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      fill={s <= Math.round(Number(product.rating || 5)) ? "#D39858" : "none"}
                      stroke="#D39858"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-[#85431E]">
                  ({Number(product.rating || 5.0).toFixed(1)})
                </span>
              </div>
            </div>

            {/* Short Description */}
            {shortDescriptionText && (
              <p className="text-[11px] sm:text-xs text-[#85431E]/80 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-2.5">
                {shortDescriptionText}
              </p>
            )}

            {/* Price Box */}
            <div className="bg-[#EACEAA]/40 p-2.5 sm:p-3 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] mb-3 flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-lg sm:text-2xl font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{salePrice.toLocaleString("en-IN")}
              </span>

              {hasDiscount && (
                <span className="text-xs sm:text-sm text-[#85431E]/60 line-through font-semibold">
                  ₹{regularPrice.toLocaleString("en-IN")}
                </span>
              )}

              {discountPercent > 0 && (
                <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-[#34150F]">Qty:</span>
              <div className="flex items-center border border-[#85431E]/30 rounded-tr-md rounded-bl-md overflow-hidden bg-[#EACEAA]/40">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-2.5 py-0.5 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors active:scale-90"
                >
                  -
                </button>
                <span className="px-3 py-0.5 text-xs font-black text-[#34150F]">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-2.5 py-0.5 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!stockInfo.isAvailable}
              className={`flex-1 py-2 sm:py-2.5 px-3 rounded-tr-xl rounded-bl-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                !stockInfo.isAvailable
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 opacity-80"
                  : added
                  ? "bg-emerald-600 text-white"
                  : "bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {!stockInfo.isAvailable ? (
                "Out of Stock"
              ) : added ? (
                <>
                  <Check size={14} /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart size={14} /> Add (₹{(salePrice * qty).toLocaleString("en-IN")})
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setQuickView(true)}
              className="py-2 sm:py-2.5 px-3 rounded-tr-xl rounded-bl-xl font-bold text-xs bg-[#D39858] text-[#34150F] hover:bg-[#EACEAA] transition-all shadow-xs active:scale-95 flex items-center gap-1"
            >
              <Eye size={13} /> View
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal Popup */}
      {quickView && (
        <QuickViewModal
          product={product}
          wishlisted={wishlisted}
          onClose={() => setQuickView(false)}
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
        />
      )}
    </>
  );
}
