import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Check, Package, Eye } from "lucide-react";
import { Product } from "../../types";
import { QuickViewModal } from "./QuickViewModal";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import { getProductStockStatus } from "../../utils/stock";

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlisted: boolean;
}

function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#34150F]/20 via-[#D39858]/10 to-[#85431E]/20 flex items-center justify-center">
        <Package size={32} className="text-[#85431E]/40" />
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
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onWishlist,
  wishlisted,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [quickView, setQuickView] = useState(false);
  const [added, setAdded] = useState(false);

  const effective = getEffectivePrice(product, user, 1, b2bCache);

  // Dynamic stock status from shared utility
  const stockInfo = getProductStockStatus(product.stock, (product as any).reorderLevel, (product as any).inStock);

  // 1. Image Priority: Thumbnail key first
  const imageSrc =
    (product as any).thumbnail ||
    (Array.isArray((product as any).images) && (product as any).images[0]) ||
    product.image ||
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop";

  // 2. Pricing Priority: Prioritize B2B calculated tier rate when user is B2B
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

  // 3. Short description
  const shortDescriptionText =
    (product as any).shortDesc ||
    product.shortDesc ||
    (typeof product.description === "string" ? product.description : "");

  // Navigate to Product Detail View Page (/product/:id)
  const handleCardClick = () => {
    const targetId = (product as any).apiId || product.id;
    navigate(`/product/${targetId}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stockInfo.isAvailable) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlist(product);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickView(true);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="relative group cursor-pointer w-full bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-2 sm:p-3.5 border border-[rgba(52,21,15,0.08)] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full"
      >
        <div>
          {/* Image Container with Thumbnail */}
          <div className="relative w-full aspect-square overflow-hidden rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl bg-[#EACEAA]/30">
            <ProductThumb src={imageSrc} name={product.name} />

            {/* Discount Percentage Badge (Top-Left) */}
            {discountPercent > 0 && (
              <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-[#34150F] text-[#D39858] text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-tr-md rounded-bl-md z-10 border border-[#D39858]/30">
                {discountPercent}% OFF
              </span>
            )}

            {/* Top-Right Wishlist Button */}
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${
                wishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-[#34150F]/80 text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
              }`}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={13} className={`sm:w-[15px] sm:h-[15px] ${wishlisted ? "fill-white" : ""}`} />
            </button>

            {/* Center Quick View Button Overlay on Card/Image Hover (Desktop only) */}
            <div className="hidden sm:flex absolute inset-0 bg-[#34150F]/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 items-center justify-center pointer-events-none group-hover:pointer-events-auto">
              <button
                type="button"
                onClick={handleOpenQuickView}
                className="flex items-center gap-1.5 bg-[#EACEAA] text-[#34150F] text-xs font-extrabold px-3 py-1.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                <Eye size={13} />
                Quick View
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-2 sm:mt-2.5">
            {/* Product Name */}
            <h4
              className="text-[#34150F] text-[11px] sm:text-xs font-bold leading-tight mb-1 line-clamp-2 min-h-[26px] sm:min-h-[30px] hover:text-[#D39858] transition-colors"
            >
              {product.name}
            </h4>

            {/* Short Description — Desktop only */}
            {shortDescriptionText && (
              <p className="hidden sm:block text-[10px] text-[#85431E]/75 leading-relaxed line-clamp-2 mb-1.5 min-h-[26px]">
                {shortDescriptionText}
              </p>
            )}

            {/* Dynamic Stock Status Badge */}
            <div className="mb-1.5">
              <span className={`inline-flex items-center text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${stockInfo.badgeClass}`}>
                {stockInfo.label}
              </span>
            </div>

            {/* Price Row: salePrice + price line-through + discount percentage */}
            <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
              {/* Sale Price */}
              <span className="text-[#34150F] font-black text-xs sm:text-base tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{salePrice.toLocaleString("en-IN")}
              </span>

              {/* Price Line-Through (Regular / Original Price) */}
              {hasDiscount && (
                <span className="text-[#85431E]/50 text-[9px] sm:text-[11px] line-through font-semibold">
                  ₹{regularPrice.toLocaleString("en-IN")}
                </span>
              )}

              {/* Discount / B2B Percentage Badge */}
              {effective.isB2B ? (
                <span className="text-[8px] font-black text-[#34150F] bg-[#D39858] px-1 py-0.2 rounded shadow-2xs uppercase tracking-wider">
                  B2B {discountPercent}%
                </span>
              ) : discountPercent > 0 && (
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!stockInfo.isAvailable}
            className={`w-full text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl transition-all duration-200 shadow-2xs flex items-center justify-center gap-1 active:scale-95 ${
              !stockInfo.isAvailable
                ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 opacity-80"
                : added
                ? "bg-emerald-600 text-white"
                : "bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E]"
            }`}
          >
            {!stockInfo.isAvailable ? (
              "Out of Stock"
            ) : added ? (
              <>
                <Check size={12} className="sm:w-3.5 sm:h-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={12} className="sm:w-3.5 sm:h-3.5" /> Add to Cart
              </>
            )}
          </button>
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
});
