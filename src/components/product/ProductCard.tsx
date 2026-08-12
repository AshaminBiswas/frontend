import { useState, memo } from "react";
import { Heart, Eye, ShoppingCart, Check, Package, Building2 } from "lucide-react";
import { Product } from "../../types";
import { QuickViewModal } from "./QuickViewModal";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";

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
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const [added, setAdded] = useState(false);

  const effective = getEffectivePrice(product, user);

  const salePrice = effective.unitPrice;
  let regularPrice = product.originalPrice || (product as any).mrp || (product as any).compareAtPrice || (product as any).regularPrice || (product as any).listPrice || 0;

  if ((!regularPrice || regularPrice <= salePrice) && product.discount && product.discount > 0) {
    regularPrice = Math.round(salePrice / (1 - product.discount / 100));
  }

  const hasDiscount = regularPrice > salePrice;
  const discountPercent = hasDiscount
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : (product.discount || 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    e.preventDefault();
    setQuickView(true);
  };

  return (
    <>
      <div
        className="relative group cursor-pointer w-full bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-3 border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div>
          {/* Image Box */}
          <div className="relative w-full aspect-square overflow-hidden rounded-tr-xl rounded-bl-xl bg-[#EACEAA]/30">
            <ProductThumb src={product.image} name={product.name} />

            {/* Discount Tag */}
            {discountPercent > 0 && (
              <span className="absolute top-2.5 left-2.5 bg-[#34150F] text-[#D39858] text-[10px] font-black px-2 py-0.5 rounded-tr-md rounded-bl-md z-10 border border-[#D39858]/30">
                -{discountPercent}%
              </span>
            )}

            {/* Eye Quick View Button (Always visible on mobile, overlay on desktop hover) */}
            <button
              type="button"
              onClick={handleOpenQuickView}
              aria-label="Quick View"
              className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#34150F]/80 text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F] flex items-center justify-center transition-all shadow-md active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
              title="Quick View"
            >
              <Eye size={15} />
            </button>

            {/* Quick View Desktop Overlay Button */}
            <div
              className={`absolute inset-0 bg-[#34150F]/35 flex items-center justify-center transition-opacity duration-300 z-10 ${
                hovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={handleOpenQuickView}
                className="flex items-center gap-1.5 bg-[#EACEAA] text-[#34150F] text-xs font-extrabold px-3.5 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-colors shadow-lg"
              >
                <Eye size={14} />
                Quick View
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3">
            {/* Product Name */}
            <h4 className="text-[#34150F] text-xs font-bold leading-snug mb-1.5 line-clamp-2 hover:text-[#D39858] transition-colors">
              {product.name}
            </h4>

            {/* Short Description */}
            {((product as any).shortDesc || product.description) && (
              <p className="text-[10px] text-[#85431E]/70 leading-relaxed line-clamp-2 mb-2">
                {(product as any).shortDesc || product.description}
              </p>
            )}

            {/* Price Row: Focused Sale Price + Small Strikethrough Regular Price */}
            <div className="flex items-baseline gap-2 mb-3 flex-wrap">
              {/* Focused Sale Price */}
              <span className="text-[#34150F] font-black text-base sm:text-lg tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{salePrice.toLocaleString("en-IN")}
              </span>

              {/* Regular Price (Strikethrough) */}
              {hasDiscount && (
                <span className="text-[#85431E]/50 text-[11px] line-through font-semibold">
                  ₹{regularPrice.toLocaleString("en-IN")}
                </span>
              )}

              {/* Discount / B2B Badge */}
              {effective.isB2B ? (
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  B2B Rate
                </span>
              ) : discountPercent > 0 ? (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {discountPercent}% OFF
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 text-xs font-bold py-2 px-2.5 rounded-tr-xl rounded-bl-xl transition-all duration-200 shadow-xs flex items-center justify-center gap-1 ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E]"
            }`}
          >
            {added ? (
              <>
                <Check size={13} /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={13} /> Add
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`p-2 border rounded-tr-xl rounded-bl-xl transition-colors ${
              wishlisted
                ? "bg-red-50 text-red-500 border-red-200"
                : "border-[#85431E]/30 text-[#85431E] hover:bg-[#34150F]/10"
            }`}
          >
            <Heart size={14} className={wishlisted ? "fill-red-500" : ""} />
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
