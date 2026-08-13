import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw,
  CheckCircle2, Building2, Minus, Plus, Star, FileText, Package,
  Share2, Award, Check, Layers, Sparkles, Flame, SlidersHorizontal,
  ChevronLeft, ChevronRight, MessageSquare, Info
} from "lucide-react";
import { Product } from "../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../data/products";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { getProductStockStatus } from "../utils/stock";
import { fetchApi } from "../services/api";
import { ProductCard } from "../components/product/ProductCard";
import { ProductDetailSkeleton } from "../components/common/Skeletons";
import { ProductReviewSection } from "../components/review/ProductReviewSection";

import { getLiveCatalog, subscribeToProductSync } from "../services/productSyncService";

// Fallback master catalog
const LOCAL_CATALOG: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

/* ── Safe Image Thumbnail ── */
function MainProductImage({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-80 md:h-[450px] bg-gradient-to-br from-[#34150F]/20 via-[#D39858]/10 to-[#85431E]/20 flex items-center justify-center rounded-tr-2xl rounded-bl-2xl">
        <Package size={56} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className="w-full h-80 md:h-[450px] object-cover rounded-tr-2xl rounded-bl-2xl transition-all duration-300"
    />
  );
}

export function ProductDetailPage({
  onAddToCart,
  onWishlist,
  wishlist,
}: {
  onAddToCart: (p: Product, qty?: number) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"SPECS" | "DESC" | "MANUFACTURER" | "REVIEWS">("SPECS");
  const [added, setAdded] = useState(false);

  // 1. Fetch Product by ID or Slug dynamically from Backend API & Live Catalog
  useEffect(() => {
    if (!id) return;

    const loadProductData = () => {
      const liveCatalog = getLiveCatalog(LOCAL_CATALOG);
      const foundLocal = liveCatalog.find(
        (p) => String(p.id) === String(id) || String((p as any).apiId) === String(id)
      );

      fetchApi<Product>(`/products/${id}`)
        .then((res) => {
          if (res.success && res.data) {
            const raw = res.data as any;
            const categoryNameStr = typeof raw.category === 'object' && raw.category?.name
              ? raw.category.name
              : (typeof raw.category === 'string' ? raw.category : (foundLocal?.category || "Hardware"));

            const salePriceVal = Number(raw.salePrice ?? raw.offerPrice ?? raw.salesPrice ?? raw.price ?? foundLocal?.price ?? 0);
            const regularPriceVal = Number(raw.price ?? raw.originalPrice ?? raw.regularPrice ?? raw.mrp ?? foundLocal?.originalPrice ?? salePriceVal);
            const discountVal = regularPriceVal > salePriceVal ? Math.round(((regularPriceVal - salePriceVal) / regularPriceVal) * 100) : Number(raw.discount || foundLocal?.discount || 0);

            const normalized: Product = {
              ...raw,
              id: typeof raw.id === 'number' ? raw.id : (foundLocal?.id || parseInt(String(id).replace(/\D/g, ''), 10) || 1),
              apiId: String(raw._id || raw.id || id),
              name: raw.name || raw.title || foundLocal?.name || "Product",
              price: salePriceVal,
              salePrice: salePriceVal,
              offerPrice: salePriceVal,
              regularPrice: regularPriceVal,
              originalPrice: regularPriceVal,
              discount: discountVal,
              thumbnail: raw.thumbnail || raw.image || (Array.isArray(raw.images) ? raw.images[0] : "") || foundLocal?.thumbnail || foundLocal?.image || "",
              image: raw.thumbnail || raw.image || (Array.isArray(raw.images) ? raw.images[0] : "") || foundLocal?.image || "",
              images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : (raw.thumbnail ? [raw.thumbnail] : (foundLocal?.images || [])),
              category: categoryNameStr,
              material: typeof raw.material === 'string' ? raw.material : (raw.specifications?.material || raw.finish || foundLocal?.material || "Solid Brass / Stainless Steel"),
              description: raw.description || raw.shortDesc || raw.shortDescription || foundLocal?.description || "",
              shortDesc: raw.shortDesc || raw.shortDescription || raw.description || foundLocal?.shortDesc || "",
              stock: raw.stock !== undefined ? Number(raw.stock) : (foundLocal?.stock ?? 50),
              reorderLevel: raw.reorderLevel !== undefined ? Number(raw.reorderLevel) : (foundLocal?.reorderLevel ?? 10),
              inStock: raw.inStock !== undefined ? raw.inStock : foundLocal?.inStock,
              sku: raw.sku || foundLocal?.sku || "",
            };

            const finalMerged = foundLocal ? { ...normalized, ...foundLocal } : normalized;
            setProduct(finalMerged);
            if (finalMerged.colours && finalMerged.colours.length > 0) {
              setSelectedColor(finalMerged.colours[0]);
            }
          } else if (foundLocal) {
            setProduct(foundLocal);
          }
        })
        .catch(() => {
          if (foundLocal) setProduct(foundLocal);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    setLoading(true);
    loadProductData();
    return subscribeToProductSync(loadProductData);
  }, [id]);

  // 2. Automatically update Document Title, Meta Description, and Meta Keywords for SEO from API
  useEffect(() => {
    if (!product) return;

    // Meta Title
    const pageTitle =
      (product as any).metaTitle ||
      (product as any).seo?.metaTitle ||
      `${product.name} | PRC Architectural Hardware`;

    document.title = pageTitle;

    // Meta Description
    const metaDescText =
      (product as any).metaDescription ||
      (product as any).seo?.metaDescription ||
      product.shortDesc ||
      (typeof product.description === "string" ? product.description : "") ||
      `Buy ${product.name} online from PRC Hardware India. Precision architectural fittings.`;

    let metaDescTag = document.querySelector('meta[name="description"]');
    if (!metaDescTag) {
      metaDescTag = document.createElement("meta");
      metaDescTag.setAttribute("name", "description");
      document.head.appendChild(metaDescTag);
    }
    metaDescTag.setAttribute("content", metaDescText);

    // Meta Keywords
    const metaKeywordsText =
      (product as any).metaKeywords ||
      (product as any).seo?.metaKeywords ||
      `${product.name}, ${product.category || "hardware"}, PRC Hardware, architectural fittings`;

    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsTag) {
      metaKeywordsTag = document.createElement("meta");
      metaKeywordsTag.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywordsTag);
    }
    metaKeywordsTag.setAttribute("content", metaKeywordsText);

    return () => {
      document.title = "PRC Hardware | Premium Architectural Hardware & Fittings";
    };
  }, [product]);

  // Gallery Images Array
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    if (product.image) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&auto=format",
      ];
    }
    return [];
  }, [product]);

  // Related Products
  const relatedProducts = useMemo(() => {
    if (!product) return LOCAL_CATALOG.slice(0, 4);
    return LOCAL_CATALOG.filter((p) => p.id !== product.id).slice(0, 4);
  }, [product]);

  if (loading || !product) {
    return <ProductDetailSkeleton />;
  }

  const isWishlisted =
    wishlist.has(product.id) ||
    wishlist.has(String(product.id)) ||
    ((product as any).apiId ? wishlist.has((product as any).apiId) : false);
  const effective = getEffectivePrice(product, user, qty);
  const stockInfo = getProductStockStatus(product.stock, (product as any).reorderLevel, (product as any).inStock);
  const discountPercent =
    effective.originalPrice > effective.unitPrice
      ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
      : (product.discount || 0);

  const activeSrc = galleryImages[activeImageIdx] || product.image;

  // Schema specifications & attributes map
  const specificationsMap: Record<string, string> = {
    "Material Grade": typeof (product as any).material === 'object'
      ? String((product as any).material?.name || "304 Grade Stainless Steel")
      : String((product as any).material || "304 Grade Solid Stainless Steel"),
    "Surface Finish": typeof (product as any).attributes?.Finish === 'object'
      ? String((product as any).attributes.Finish.name || selectedColor || "PVD Brushed Gold")
      : String((product as any).attributes?.Finish || selectedColor || "PVD Brushed Gold"),
    "Mounting Type": typeof (product as any).attributes?.MountingType === 'object'
      ? String((product as any).attributes.MountingType.name || "Concealed Screw Fastening")
      : String((product as any).attributes?.MountingType || "Concealed Screw Fastening"),
    "Dimensions (L x W x H)": typeof product.dimensions === 'object' && product.dimensions !== null
      ? `${(product.dimensions as any).length || 20} x ${(product.dimensions as any).width || 5} x ${(product.dimensions as any).height || 3} ${(product.dimensions as any).unit || "cm"}`
      : String(product.dimensions || "20 x 5 x 3.5 cm"),
    "Weight": typeof product.weight === 'object' ? String((product.weight as any).value || "0.450 kg") : (product.weight ? `${product.weight} kg` : "0.450 kg"),
    "Warranty": typeof product.warranty === 'object' ? String((product.warranty as any).name || "2 Years Guarantee") : String(product.warranty || "2 Years Manufacturer Guarantee"),
    "Load Capacity": typeof (product as any).specification?.LoadCapacity === 'object' ? String((product.specification as any).LoadCapacity.value || "45 kg") : String((product as any).specification?.LoadCapacity || "45 kg static load"),
    "Cycle Test Rating": typeof (product as any).specification?.CycleTest === 'object' ? String((product.specification as any).CycleTest.value || "200,000") : String((product as any).specification?.CycleTest || "200,000 Opening Cycles Tested"),
  };

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      onAddToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ BREADCRUMB & BACK LINK ═══════════════ */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 lg:px-16 pt-5 sm:pt-8 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Catalog
          </button>

          {/* Breadcrumb Trail */}
          <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#85431E]/70">
            <Link to="/" className="hover:text-[#34150F]">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-[#34150F]">Products</Link>
            <span>/</span>
            <span className="text-[#34150F] font-bold truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ═══════════════ MAIN PRODUCT HERO GRID ═══════════════ */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 lg:px-16 pb-12">
        <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-4 sm:p-6 md:p-8 border border-[rgba(52,21,15,0.08)] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* ── Left Column: Multi-Image Gallery ── */}
          <div className="lg:col-span-6">
            <div className="relative bg-[#EACEAA]/30 rounded-tr-2xl rounded-bl-2xl p-2 overflow-hidden border border-[rgba(52,21,15,0.08)] shadow-inner">
              <MainProductImage src={activeSrc} name={product.name} />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discountPercent > 0 && (
                  <span className="bg-[#34150F] text-[#D39858] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-tr-lg rounded-bl-lg shadow-md border border-[#D39858]/30 flex items-center gap-1">
                    <Flame size={12} className="fill-[#D39858]" /> {discountPercent}% OFF
                  </span>
                )}
                {product.isBestseller && (
                  <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-tr-lg rounded-bl-lg shadow-md">
                    BEST SELLER
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-tr-lg rounded-bl-lg shadow-md">
                    NEW DROP
                  </span>
                )}
              </div>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => onWishlist(product)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                  isWishlisted ? "bg-red-50 text-red-500" : "bg-white/90 text-[#34150F] hover:bg-white"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-tr-xl rounded-bl-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIdx === idx
                        ? "border-[#34150F] scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Column: Details & Actions ── */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#85431E] bg-[#EACEAA]/60 px-3 py-1 rounded-full border border-[rgba(52,21,15,0.08)]">
                  {typeof product.category === 'object'
                    ? (product.category as any).name || "Architectural Hardware"
                    : (product.category || "Architectural Hardware")}
                </span>
                <span className="text-[10px] font-mono text-[#85431E]/70">
                  SKU: {product.sku || `PRC-HD-${product.id}`}
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-2xl md:text-3xl font-black text-[#34150F] leading-snug mb-3"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("REVIEWS");
                  document.getElementById("product-reviews-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 mb-5 cursor-pointer hover:opacity-80 transition-opacity text-left"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill={s <= (product.rating || 5) ? "#D39858" : "none"}
                      stroke="#D39858"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#34150F]">
                  {product.rating || 4.9} ★
                </span>
                <span className="text-xs text-[#85431E]/70 font-semibold underline decoration-dotted">
                  See customer reviews
                </span>
              </button>


              {/* Pricing Box */}
              <div className="bg-[#EACEAA]/40 p-5 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.1)] mb-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span
                    className="text-3xl md:text-4xl font-black text-[#34150F]"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    ₹{effective.unitPrice.toLocaleString("en-IN")}
                  </span>
                  {effective.originalPrice > effective.unitPrice && (
                    <span className="text-base text-[#85431E]/60 line-through">
                      ₹{effective.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      Save ₹{(effective.originalPrice - effective.unitPrice).toLocaleString("en-IN")} ({discountPercent}%)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#85431E] font-semibold flex items-center gap-1.5 mt-2">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  Inclusive of all taxes • GST Input Tax Credit available on invoice
                </p>
              </div>

              {/* Available Colors / Finishes */}
              {product.colours && product.colours.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-[#34150F] block mb-2">
                    Select Finish / Color: <span className="text-[#D39858] font-black">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colours.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-1.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all border ${
                          selectedColor === color
                            ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                            : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.15)] hover:border-[#D39858]"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatibility Tags */}
              {product.compatibleFor && product.compatibleFor.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-[#34150F] block mb-2">
                    Compatible Applications:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {product.compatibleFor.map((item) => (
                      <span
                        key={item}
                        className="bg-[#34150F]/10 text-[#34150F] text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-[rgba(52,21,15,0.1)]"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-[#34150F]">Quantity:</span>
                <div className="flex items-center border border-[#85431E]/30 rounded-tr-lg rounded-bl-lg overflow-hidden bg-[#EACEAA]/40 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-5 py-2 text-xs font-black text-[#34150F]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3.5 py-2 text-xs font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${stockInfo.badgeClass}`}>
                  {stockInfo.label} ({product.stock ?? 0} Available)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!stockInfo.isAvailable}
                  className={`flex-1 py-3.5 px-6 rounded-tr-xl rounded-bl-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
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
                      <Check size={16} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} /> Add to Cart (₹{(effective.unitPrice * qty).toLocaleString("en-IN")})
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!stockInfo.isAvailable}
                  onClick={() => {
                    if (!stockInfo.isAvailable) return;
                    handleAddToCart();
                    navigate("/checkout");
                  }}
                  className={`font-black text-xs py-3.5 px-6 rounded-tr-xl rounded-bl-xl transition-all shadow-md active:scale-95 ${
                    !stockInfo.isAvailable
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed hidden"
                      : "bg-[#D39858] text-[#34150F] hover:bg-[#EACEAA]"
                  }`}
                >
                  Buy Now →
                </button>
              </div>

              {/* Service Badges Bar */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[rgba(52,21,15,0.08)] text-center">
                <div className="flex flex-col items-center gap-1 p-2 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl">
                  <Truck size={18} className="text-[#D39858]" />
                  <span className="text-[10px] font-bold text-[#34150F]">Fast Pan-India Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl">
                  <ShieldCheck size={18} className="text-[#D39858]" />
                  <span className="text-[10px] font-bold text-[#34150F]">{product.warranty || "2-Yr Guarantee"}</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl">
                  <RotateCcw size={18} className="text-[#D39858]" />
                  <span className="text-[10px] font-bold text-[#34150F]">7 Days Easy Return</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ═══════════════ TABBED SPECIFICATIONS & SCHEMA DETAILS ═══════════════ */}
      <section id="product-reviews-section" className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-16">

        <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 border border-[rgba(52,21,15,0.08)] shadow-sm">

          {/* Tab Strip */}
          <div className="flex items-center gap-2 border-b border-[rgba(52,21,15,0.1)] pb-3 mb-6 overflow-x-auto scrollbar-none">
            {[
              { key: "SPECS", label: "Technical Specifications" },
              { key: "DESC", label: "Full Description & Application" },
              { key: "MANUFACTURER", label: "Manufacturer & Brand Info" },
              { key: "REVIEWS", label: "Customer Reviews & Ratings" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                className={`px-5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  activeTab === t.key
                    ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                    : "bg-[#EACEAA]/40 text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: TECHNICAL SPECS */}
          {activeTab === "SPECS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {Object.entries(specificationsMap).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3.5 bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]"
                >
                  <span className="text-xs font-bold text-[#85431E]">{key}</span>
                  <span className="text-xs font-black text-[#34150F]">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: FULL DESCRIPTION */}
          {activeTab === "DESC" && (
            <div className="space-y-4 text-xs text-[#85431E] leading-relaxed animate-in fade-in duration-200">
              <p className="font-semibold text-sm text-[#34150F]">
                {product.shortDesc || product.name}
              </p>
              <p>
                {product.description ||
                  "Precision manufactured by PRC Hardware using high-grade architectural metals. Designed for heavy-duty residential and commercial applications with ultra-smooth operating cycles and corrosion-resistant finishes."}
              </p>
              <div className="bg-[#EACEAA]/30 p-4 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] mt-4">
                <h4 className="font-bold text-[#34150F] text-xs uppercase tracking-wider mb-2">
                  Key Installation Features:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Universal mounting pattern compatible with standard door/cabinet pre-drills.</li>
                  <li>Supplied with high-tensile mounting screws and alignment template.</li>
                  <li>Electroplated protective coating prevents tarnishing and finger marks.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: MANUFACTURER INFO */}
          {activeTab === "MANUFACTURER" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div className="p-4 bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]">
                <p className="text-[10px] font-bold text-[#85431E] uppercase">Brand Name</p>
                <p className="text-sm font-black text-[#34150F]">PRC Hardware India</p>
              </div>
              <div className="p-4 bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]">
                <p className="text-[10px] font-bold text-[#85431E] uppercase">Country of Origin</p>
                <p className="text-sm font-black text-[#34150F]">India</p>
              </div>
              <div className="p-4 bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]">
                <p className="text-[10px] font-bold text-[#85431E] uppercase">Manufacturer / Dispatch Address</p>
                <p className="text-sm font-black text-[#34150F]">
                  {(product as any).manufacturerInfo?.address || (product as any).address || "H -3, J.R. COMPLEX GATE NO 4, MELA RAM FARM, MANDOLI, DELHI 110093, INDIA"}
                </p>
              </div>
              <div className="p-4 bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]">
                <p className="text-[10px] font-bold text-[#85431E] uppercase">Quality Standards</p>
                <p className="text-sm font-black text-[#34150F]">
                  {(product as any).manufacturerInfo?.qualityStandards || (product as any).qualityStandards || "ISO 9001 : 2015"}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER REVIEWS */}
          {activeTab === "REVIEWS" && (
            <div className="animate-in fade-in duration-200">
              <ProductReviewSection
                productId={(product as any).apiId || String(product.id) || id || ""}
                productName={product.name}
              />
            </div>
          )}


        </div>
      </section>

      {/* ═══════════════ RELATED PRODUCTS CAROUSEL ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold text-[#34150F]"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Frequently Paired Hardware
          </h2>
          <Link to="/products" className="text-xs font-bold text-[#85431E] hover:text-[#34150F]">
            View All Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {relatedProducts.map((rel) => (
            <ProductCard
              key={rel.id}
              product={rel}
              onAddToCart={onAddToCart}
              onWishlist={onWishlist}
              wishlisted={wishlist.has(rel.id)}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
