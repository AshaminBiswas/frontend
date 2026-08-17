import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Tag, Percent, Flame, Clock, Search, Filter,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, ShieldCheck, Truck, Copy, Sparkles,
  ArrowRight, RefreshCw, Gift, Zap
} from "lucide-react";
import { Product } from "../types";
import {
  SUPER_SAVER_PRODUCTS,
  VALUE_MONEY_PRODUCTS,
  BEST_SELLER_PRODUCTS
} from "../data/products";
import { couponService, Coupon } from "../services/couponService";
import { bannerService, Banner } from "../services/bannerService";
import { fetchApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";
import { ProductGridSkeleton } from "../components/common/Skeletons";

// Fallback local products
const LOCAL_CATALOG: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

// Fallback coupons if backend is offline
const FALLBACK_COUPONS: Coupon[] = [
  {
    id: "1",
    code: "WELCOME10",
    description: "Flat 10% discount for all retail customers",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 499,
    isActive: true,
  },
  {
    id: "2",
    code: "PRCBULK15",
    description: "Flat 15% discount for B2B bulk & contractor orders",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 5000,
    isActive: true,
  },
  {
    id: "3",
    code: "FREESHIP2K",
    description: "Free Express Shipping on orders over ₹2,000",
    discountType: "FIXED_AMOUNT",
    discountValue: 100,
    minOrderAmount: 2000,
    isActive: true,
  },
];

/* ── Safe Image Thumbnail ── */
function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-[#34150F]/20 via-[#D39858]/10 to-[#85431E]/20 flex items-center justify-center border-b border-[#34150F]/8">
        <Package size={36} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <div className="w-full h-48 overflow-hidden bg-[#EACEAA]/20 border-b border-[#34150F]/8 relative group">
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

interface OffersPageProps {
  onAddToCart: (product: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function OffersPage({ onAddToCart, onWishlist, wishlist }: OffersPageProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [products, setProducts] = useState<Product[]>(LOCAL_CATALOG);
  const [coupons, setCoupons] = useState<Coupon[]>(FALLBACK_COUPONS);
  const [loading, setLoading] = useState(false);

  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  const [search, setSearch] = useState("");
  const [discountTier, setDiscountTier] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Fetch Offer Products, Banners, and Promo Codes dynamically from Backend API
  useEffect(() => {
    setLoading(true);

    // 1. Fetch Dynamic Coupons from API
    couponService
      .getPublicCoupons()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setCoupons(res.data);
        } else {
          setCoupons(FALLBACK_COUPONS);
        }
      })
      .catch(() => setCoupons(FALLBACK_COUPONS));

    // 2. Fetch Dynamic Offer Products from API
    fetchApi<{ products: Product[] }>("/products?isInOffer=true")
      .then((res) => {
        if (res.success && res.data && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        } else {
          fetchApi<{ products: Product[] }>("/products")
            .then((resAll) => {
              if (resAll.success && resAll.data && resAll.data.products && resAll.data.products.length > 0) {
                setProducts(resAll.data.products);
              } else {
                setProducts(LOCAL_CATALOG);
              }
            })
            .catch(() => setProducts(LOCAL_CATALOG));
        }
      })
      .catch(() => setProducts(LOCAL_CATALOG))
      .finally(() => setLoading(false));

    // 3. Fetch Banners
    bannerService
      .getPublicBanners("OFFERS_HERO")
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) setTopBanner(res.data[0]);
      })
      .catch(() => {});

    bannerService
      .getPublicBanners("OFFERS_MID")
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) setMidBanner(res.data[0]);
      })
      .catch(() => {});
  }, []);

  // Filter products by discount percentage & criteria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (category !== "ALL") {
        const cat = p.category?.toUpperCase() || "";
        if (!cat.includes(category.toUpperCase())) return false;
      }
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;

      const effective = getEffectivePrice(p, user, 1, b2bCache);
      const discount = effective.isB2B
        ? effective.b2bDiscountPercent
        : effective.originalPrice > effective.unitPrice
        ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
        : p.discount || 0;

      if (discountTier === "50_PLUS" && discount < 50) return false;
      if (discountTier === "40_PLUS" && discount < 40) return false;
      if (discountTier === "UNDER_200" && effective.unitPrice >= 200) return false;

      return true;
    });
  }, [products, search, category, discountTier, inStockOnly, user, b2bCache]);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ OFFERS HERO BANNER (DYNAMIC API DATA) ═══════════════ */}
      <section className="relative min-h-[55vh] bg-gradient-to-br from-[#34150F] via-[#5c2415] to-[#85431E] text-center flex items-center justify-center overflow-hidden py-14 px-4 sm:px-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              topBanner?.image ||
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=800&fit=crop&auto=format"
            }
            alt="Offers Hero"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/75 via-[#34150F]/35 to-black/20" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Ticker Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] px-4 py-1.5 rounded-full mb-4 shadow-lg animate-bounce">
            <Zap size={15} className="fill-[#34150F]" />
            <span className="text-xs font-black uppercase tracking-widest">
              Live Promo Codes & Dynamic Deals
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#EACEAA] mb-3 tracking-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {topBanner?.title || "Super Deals & Mega Savings"}
          </h1>

          <p className="text-xs sm:text-base text-[#EACEAA]/80 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            {topBanner?.subtitle ||
              "Up to 56% off premium cabinet handles, door hinges, drawer knobs, and smart locks. Direct factory pricing with pan-India delivery."}
          </p>

          {/* Dynamic Copyable Promo Codes Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {coupons.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCopyCode(c.code)}
                className="bg-[#EACEAA]/15 border border-[#D39858]/40 hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all flex items-center gap-2 shadow"
              >
                <span>{c.code}</span>
                {copiedCode === c.code ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ DEAL TIERS STRIP ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-5 px-4 md:px-8 lg:px-16 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Percent, label: "Up to 56% OFF", sub: "Super saver items" },
            { icon: Zap, label: "Flash Deals Under ₹199", sub: "Knobs & catches steals" },
            { icon: Truck, label: "Free Shipping @ ₹2,000", sub: "Pan-India express delivery" },
            { icon: ShieldCheck, label: "GST Input Tax Credit", sub: "100% genuine B2B invoice" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-tr-xl rounded-bl-xl bg-[#EACEAA]/30 border border-[rgba(52,21,15,0.06)] text-left"
            >
              <div className="w-10 h-10 rounded-tr-lg rounded-bl-lg bg-[#34150F] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#D39858]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#34150F]">{label}</h4>
                <p className="text-[10px] text-[#85431E]/70 leading-tight mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MAIN OFFERS & DEALS CONTENT ═══════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">

        {/* ── Deal Filter Tabs ── */}
        <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto touch-pan-x pb-3 mb-6 scrollbar-none">
          {[
            { id: "ALL", label: "All Active Offers" },
            { id: "50_PLUS", label: "50%+ OFF Steals" },
            { id: "40_PLUS", label: "40%+ OFF Deals" },
            { id: "UNDER_200", label: "Deals Under ₹200" },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => { setDiscountTier(tier.id); setPage(1); }}
              className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
                discountTier === tier.id
                  ? "bg-[#34150F] text-[#D39858] border-transparent shadow-md"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* ── Filter Controls ── */}
        <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 border border-[rgba(52,21,15,0.08)] shadow-sm mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search offer products..."
                className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/50 pl-8 pr-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold truncate"
            >
              <option value="ALL">All Product Categories</option>
              <option value="HANDLES">Handles</option>
              <option value="HINGES">Hinges</option>
              <option value="LOCKS">Locks</option>
              <option value="KNOBS">Knobs</option>
              <option value="CATCHES">Catches</option>
            </select>

            {/* Stock Filter */}
            <label className="flex items-center gap-2 bg-[#EACEAA] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] cursor-pointer select-none font-bold text-[#34150F]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#34150F] rounded"
              />
              <span>In Stock Deals Only</span>
            </label>

            {/* Reset */}
            {(search || discountTier !== "ALL" || category !== "ALL" || inStockOnly) && (
              <button
                type="button"
                onClick={() => { setSearch(""); setDiscountTier("ALL"); setCategory("ALL"); setInStockOnly(false); setPage(1); }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-2"
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ── Products Section Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Active Special Offers
            </h2>
            <p className="text-xs text-[#85431E] mt-0.5">
              Showing {displayedProducts.length} of {filteredProducts.length} deal items
            </p>
          </div>
        </div>

        {/* ── Offer Products Grid ── */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-sm">
            <Package size={42} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No offer products match criteria</h3>
            <p className="text-xs text-[#85431E]">Try selecting another discount tier or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
            {displayedProducts.map((product) => {
              const isAdded = addedIds.has(product.id);
              const isWishlisted =
                wishlist.has(product.id) ||
                wishlist.has(String(product.id)) ||
                ((product as any).apiId ? wishlist.has((product as any).apiId) : false);
              const effective = getEffectivePrice(product, user, 1, b2bCache);
              const discountPercent = effective.isB2B
                ? effective.b2bDiscountPercent
                : effective.originalPrice > effective.unitPrice
                ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
                : product.discount || 0;
              const savingsRupees = Math.max(0, effective.originalPrice - effective.unitPrice);

              return (
                <div
                  key={product.id}
                  className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl border border-[#D39858]/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Thumbnail + Deal Ribbon */}
                    <div className="relative">
                      <ProductThumb src={product.image} name={product.name} />

                      {/* DISCOUNT RIBBON */}
                      {discountPercent > 0 && (
                        <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow-md flex items-center gap-1 border border-[#D39858]/30">
                          <Flame size={11} className="fill-[#D39858]" />
                          {effective.isB2B ? `B2B ${discountPercent}% OFF` : `${discountPercent}% OFF`}
                        </span>
                      )}

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => onWishlist(product)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm shadow flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                          isWishlisted ? "bg-red-50 text-red-500" : "bg-white/85 text-[#34150F] hover:bg-white"
                        }`}
                        title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                      >
                        <Heart size={15} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <Link to={`/product/${(product as any).apiId || product.id}`}>
                        <h3 className="text-sm font-bold text-[#34150F] leading-snug line-clamp-2 hover:text-[#D39858] transition-colors mb-1">
                          {product.name}
                        </h3>
                      </Link>

                      {((product as any).shortDesc || product.description) && (
                        <p className="text-[10px] text-[#85431E]/65 leading-relaxed line-clamp-2 mb-2">
                          {(product as any).shortDesc || product.description}
                        </p>
                      )}

                      {/* Stars */}
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
                        <span className="text-[10px] text-[#85431E]/60 font-bold">
                          ({product.rating || 5}.0)
                        </span>
                      </div>

                      {/* Price & Savings Pill */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-lg font-black text-[#34150F]"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            ₹{effective.unitPrice.toLocaleString("en-IN")}
                          </span>
                          {effective.originalPrice > effective.unitPrice && (
                            <span className="text-xs text-[#85431E]/50 line-through font-semibold">
                              ₹{effective.originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {savingsRupees > 0 && (
                          <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-200">
                            You save ₹{savingsRupees.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="p-5 pt-0">
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
                          <ShoppingCart size={14} /> Grab Deal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination Bar ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 my-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-tr-lg rounded-bl-lg bg-[#f5e8d4] border border-[rgba(52,21,15,0.15)] flex items-center justify-center text-[#34150F] disabled:opacity-40 hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-tr-lg rounded-bl-lg font-bold text-xs transition-colors ${
                  page === pageNum
                    ? "bg-[#34150F] text-[#EACEAA]"
                    : "bg-[#f5e8d4] border border-[rgba(52,21,15,0.15)] text-[#34150F] hover:bg-[#D39858]"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-tr-lg rounded-bl-lg bg-[#f5e8d4] border border-[rgba(52,21,15,0.15)] flex items-center justify-center text-[#34150F] disabled:opacity-40 hover:bg-[#34150F] hover:text-[#EACEAA] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════ DYNAMIC PROMO CODES GRID (FROM BACKEND API) ═══════════════ */}
      <section className="py-14 bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.08)] px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Gift size={28} className="text-[#D39858] mx-auto mb-2" />
            <h2
              className="text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              DYNAMIC PROMO CODES & COUPONS
            </h2>
            <p className="text-xs sm:text-sm text-[#85431E]">
              Tap any coupon code below to copy it for immediate use at checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-[#f5e8d4] p-6 rounded-tr-2xl rounded-bl-2xl border-2 border-dashed border-[#D39858]/60 relative flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#34150F] bg-[#D39858]/30 px-2.5 py-1 rounded">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}% OFF`
                        : `₹${c.discountValue} OFF`}
                    </span>
                    {c.minOrderAmount && (
                      <span className="text-[10px] text-[#85431E]/70 font-bold">
                        Min Order: ₹{c.minOrderAmount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#85431E] leading-relaxed mb-4">
                    {c.description || `Use promo code ${c.code} to save at checkout.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(c.code)}
                  className="w-full bg-[#34150F] text-[#EACEAA] font-bold py-2.5 px-4 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-xs flex items-center justify-center gap-2"
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check size={14} className="text-emerald-400" /> Code Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Code: {c.code}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MID-PAGE BANNER (DYNAMIC API DATA) ═══════════════ */}
      <section className="relative h-[38vh] min-h-[280px] bg-[#34150F] my-12 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              midBanner?.image ||
              "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=600&fit=crop&auto=format"
            }
            alt="Mid Banner"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/75 via-[#34150F]/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-3xl px-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#EACEAA] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {midBanner?.title || "Contractor & Bulk Architect Deals"}
          </h2>
          <p className="text-xs sm:text-sm text-[#EACEAA]/70 max-w-xl mx-auto mb-6">
            {midBanner?.subtitle ||
              "Unlock specialized trade pricing, custom hardware manufacturing, and tax input invoices for commercial site orders."}
          </p>
          <Link
            to="/request-quote"
            className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] font-black px-7 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs uppercase tracking-wider shadow-lg"
          >
            Request Wholesale Quote →
          </Link>
        </div>
      </section>

    </div>
  );
}
