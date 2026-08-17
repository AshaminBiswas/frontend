import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Heart, ShoppingCart, Check, Star, ShieldCheck, Truck, Package, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import { getProductStockStatus } from "../../utils/stock";

interface QuickViewModalProps {
  product: Product;
  wishlisted: boolean;
  onClose: () => void;
  onAddToCart: (p: Product, qty?: number) => void;
  onWishlist: (p: Product | number | string) => void;
}

export function QuickViewModal({
  product,
  wishlisted,
  onClose,
  onAddToCart,
  onWishlist,
}: QuickViewModalProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic gallery images array
  const galleryImages = useMemoGallery(product);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [imgErrored, setImgErrored] = useState<Record<number, boolean>>({});
  const [isImgChanging, setIsImgChanging] = useState(false);

  // Smooth entrance animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 15);
    return () => clearTimeout(timer);
  }, []);

  // Smooth exit animation before calling parent onClose
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleThumbnailClick = (idx: number) => {
    if (idx === activeImageIdx) return;
    setIsImgChanging(true);
    setTimeout(() => {
      setActiveImageIdx(idx);
      setIsImgChanging(false);
    }, 120);
  };

  const effective = getEffectivePrice(product, user, quantity, b2bCache);
  const stockInfo = getProductStockStatus(product.stock, (product as any).reorderLevel, (product as any).inStock);
  const discountPercent =
    effective.originalPrice > effective.unitPrice
      ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
      : (product.discount || 0);

  const categoryName = typeof product.category === 'object' && product.category !== null
    ? (product.category as any).name || "Architectural Hardware"
    : String(product.category || "Architectural Hardware");

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      handleClose();
    }, 1200);
  };

  const activeSrc = galleryImages[activeImageIdx] || (Array.isArray((product as any).images) && (product as any).images[0]) || (product as any).thumbnail || product.image;

  const modalContent = (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out z-[10000] ${
        isOpen
          ? "bg-black/60 backdrop-blur-md opacity-100"
          : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[#EACEAA] rounded-tr-3xl rounded-bl-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[92vh] overflow-y-auto transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with Smooth Rotation Hover */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-90 shadow-xl cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image & Thumbnails Gallery Section */}
          <div className="w-full md:w-1/2 p-5 flex flex-col justify-between bg-[#f0ddbf] flex-shrink-0">
            {/* Main Preview Image with Hover Zoom Micro-interaction */}
            <div className="relative w-full h-64 md:h-72 rounded-tr-2xl rounded-bl-2xl overflow-hidden bg-[#EACEAA]/40 shadow-inner flex items-center justify-center group">
              {imgErrored[activeImageIdx] || !activeSrc ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#34150F]/10">
                  <Package size={42} className="text-[#85431E]/40 mb-1" />
                  <span className="text-[10px] text-[#85431E]/60 font-bold">Image Preview</span>
                </div>
              ) : (
                <img
                  src={activeSrc}
                  alt={product.name}
                  onError={() => setImgErrored((prev) => ({ ...prev, [activeImageIdx]: true }))}
                  className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                    isImgChanging ? "opacity-30 scale-98" : "opacity-100 scale-100"
                  }`}
                />
              )}

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow-md border border-[#D39858]/30">
                  {discountPercent}% OFF
                </span>
              )}

              {/* Prev / Next arrows if multiple gallery images */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleThumbnailClick(activeImageIdx > 0 ? activeImageIdx - 1 : galleryImages.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#34150F]/75 text-[#EACEAA] flex items-center justify-center hover:bg-[#34150F] active:scale-90 transition-all shadow-md"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThumbnailClick(activeImageIdx < galleryImages.length - 1 ? activeImageIdx + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#34150F]/75 text-[#EACEAA] flex items-center justify-center hover:bg-[#34150F] active:scale-90 transition-all shadow-md"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Gallery Thumbnails Switcher with Smooth Micro-scale */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none justify-center">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailClick(idx)}
                    className={`w-12 h-12 rounded-tr-lg rounded-bl-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
                      activeImageIdx === idx
                        ? "border-[#34150F] scale-105 shadow-md ring-2 ring-[#D39858]/40"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Content Box */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category */}
              {categoryName && (
                <p className="text-[10px] text-[#85431E] font-black uppercase tracking-widest mb-1">
                  {categoryName}
                </p>
              )}

              {/* Product Name */}
              <h3
                className="text-xl md:text-2xl font-bold text-[#34150F] leading-tight mb-2"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                {product.name}
              </h3>

              {/* Dynamic Material, Stock Status & Review Rating */}
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span className="inline-block bg-[#34150F]/10 text-[#85431E] text-xs font-bold px-3 py-1 rounded-full">
                  Material: {product.material || (product as any).finish || ((product as any).specifications?.material) || "Solid Brass / Stainless Steel"}
                </span>

                <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${stockInfo.badgeClass}`}>
                  {stockInfo.label}
                </span>

                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= Math.round(Number(product.rating || 5)) ? "#D39858" : "none"}
                        stroke="#D39858"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#85431E]">
                    review ({Number(product.rating || 5.0).toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mb-4 bg-[#f5e8d4] p-3.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] flex-wrap">
                <span
                  className="text-2xl font-black text-[#34150F]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  ₹{effective.unitPrice.toLocaleString("en-IN")}
                </span>
                {effective.originalPrice > effective.unitPrice && (
                  <span className="text-sm text-[#85431E]/60 line-through font-semibold">
                    ₹{effective.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Save ₹{(effective.originalPrice - effective.unitPrice).toLocaleString("en-IN")}
                  </span>
                )}
                {effective.isB2B && (
                  <span className="text-[10px] font-bold text-[#EACEAA] bg-[#34150F] px-2 py-0.5 rounded flex items-center gap-1">
                    <Building2 size={11} className="text-[#D39858]" /> B2B Rate
                  </span>
                )}
              </div>

              {/* Description */}
              {(product.description || (product as any).shortDesc) && (
                <p className="text-xs text-[#85431E] leading-relaxed mb-6">
                  {product.description || (product as any).shortDesc}
                </p>
              )}

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-[#34150F]">Quantity:</span>
                <div className="flex items-center border border-[#85431E]/30 rounded-tr-lg rounded-bl-lg overflow-hidden bg-[#f5e8d4] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-black text-[#34150F] select-none min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!stockInfo.isAvailable}
                  className={`flex-1 py-3.5 px-5 rounded-tr-xl rounded-bl-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-md active:scale-95 cursor-pointer ${
                    !stockInfo.isAvailable
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300"
                      : added
                      ? "bg-emerald-600 text-white scale-102"
                      : "bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] hover:shadow-lg"
                  }`}
                >
                  {!stockInfo.isAvailable ? (
                    "Out of Stock"
                  ) : added ? (
                    <>
                      <Check size={16} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} /> Add to Cart (₹{(effective.unitPrice * quantity).toLocaleString("en-IN")})
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onWishlist(product)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`px-4 rounded-tr-xl rounded-bl-xl border border-[#85431E] transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 ${
                    wishlisted
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-[#f5e8d4] text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA]"
                  }`}
                >
                  <Heart size={18} className={wishlisted ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-between text-[10px] text-[#85431E]/80 pt-3 border-t border-[rgba(52,21,15,0.08)]">
                <span className="flex items-center gap-1 font-semibold">
                  <Truck size={12} className="text-[#D39858]" /> Fast Pan-India Dispatch
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck size={12} className="text-[#D39858]" /> 100% Quality Inspected
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* Helper hook to generate gallery images list from product.images */
function useMemoGallery(product: Product): string[] {
  const imgs = (product as any).images || product.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const validList = imgs.filter((img: any) => typeof img === "string" && img.trim().length > 0);
    if (validList.length > 0) return validList;
  }
  const single = (product as any).thumbnail || product.image;
  return single ? [single] : [];
}
