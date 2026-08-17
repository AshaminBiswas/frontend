import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Award, Truck, ShieldCheck, Lock, Search, Filter,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, Flame, Users, ThumbsUp, ArrowRight, Sparkles
} from "lucide-react";
import { Product } from "../types";
import {
  BEST_SELLER_PRODUCTS,
  SUPER_SAVER_PRODUCTS,
  VALUE_MONEY_PRODUCTS
} from "../data/products";
import { bannerService, Banner } from "../services/bannerService";
import { getLiveCatalog, subscribeToProductSync } from "../services/productSyncService";
import { ProductCard } from "../components/product/ProductCard";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";

// Combine and deduplicate master catalog
const ALL_CATALOG: Product[] = Array.from(
  new Map(
    [...BEST_SELLER_PRODUCTS, ...SUPER_SAVER_PRODUCTS, ...VALUE_MONEY_PRODUCTS].map((p) => [p.id, p])
  ).values()
);

/* ── Safe Image Thumbnail ── */
function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-[#EACEAA] to-[#D39858]/30 flex items-center justify-center border-b border-[#34150F]/8">
        <Package size={32} className="text-[#85431E]/40" />
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

const REVIEWS = [
  { id: 1, name: "Vikram R.", role: "Architect, Mumbai", rating: 5, comment: "Unmatched finishing and strength. These handles completely elevated our duplex interior project." },
  { id: 2, name: "Sneha Kapoor", role: "Interior Stylist, Delhi", rating: 5, comment: "Fast pan-India delivery and 100% genuine brass fittings. PRC Hardware is my permanent vendor." },
  { id: 3, name: "Rohan Patel", role: "Contractor, Ahmedabad", rating: 5, comment: "Ordered 200+ sets for a hotel project. Heavy duty, zero defects, and amazing bulk pricing." },
  { id: 4, name: "Ananya Iyer", role: "Homeowner, Bengaluru", rating: 5, comment: "The soft-close hinges work silently. Upgraded all my kitchen cabinets — super satisfied!" },
  { id: 5, name: "Manish Sharma", role: "Furniture Maker, Pune", rating: 5, comment: "Precision engineering and reliable locks. Customer support gave great guidance." },
];

const RELATED_PRODUCTS = ALL_CATALOG.slice(4, 8);

interface BestSellersPageProps {
  onAddToCart: (product: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function BestSellersPage({ onAddToCart, onWishlist, wishlist }: BestSellersPageProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  // Banners state
  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [priceRange, setPriceRange] = useState("ALL");
  const [minRating, setMinRating] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);

  // View state: 'TOP4' or 'ALL20'
  const [viewMode, setViewMode] = useState<"TOP4" | "ALL20">("TOP4");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Auto-scroll reviewer carousel
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch banners from API
    bannerService.getPublicBanners("BESTSELLERS_TOP").then((res) => {
      if (res.success && res.data && res.data.length > 0) setTopBanner(res.data[0]);
    }).catch(() => {});

    bannerService.getPublicBanners("BESTSELLERS_MID").then((res) => {
      if (res.success && res.data && res.data.length > 0) setMidBanner(res.data[0]);
    }).catch(() => {});
  }, []);

  const [liveCatalog, setLiveCatalog] = useState<Product[]>(() => getLiveCatalog(ALL_CATALOG));

  useEffect(() => {
    const refresh = () => setLiveCatalog(getLiveCatalog(ALL_CATALOG));
    refresh();
    return subscribeToProductSync(refresh);
  }, []);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    return liveCatalog.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (category !== "ALL" && p.category?.toUpperCase() !== category.toUpperCase()) return false;
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;
      if (minRating === "4" && (p.rating || 5) < 4) return false;
      const effective = getEffectivePrice(p, user, 1, b2bCache);
      const currentPrice = effective.unitPrice;
      if (priceRange === "UNDER_200" && currentPrice >= 200) return false;
      if (priceRange === "200_500" && (currentPrice < 200 || currentPrice > 500)) return false;
      if (priceRange === "OVER_500" && currentPrice <= 500) return false;
      return true;
    });
  }, [search, category, priceRange, minRating, inStockOnly, liveCatalog, user, b2bCache]);

  // Displayed products based on viewMode & pagination
  const displayedProducts = useMemo(() => {
    if (viewMode === "TOP4") {
      return filteredProducts.slice(0, 4);
    } else {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredProducts, viewMode, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

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

      {/* ═══════════════ SECTION 1: TOP BANNER (2/3 SCREEN HEIGHT) ═══════════════ */}
      <section className="relative h-[60vh] min-h-[420px] bg-[#34150F] flex items-center justify-center text-center overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              topBanner?.image ||
              "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop&auto=format"
            }
            alt="Best Sellers Banner"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/75 via-[#34150F]/35 to-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl px-4 sm:px-8">
          <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-4 py-1.5 rounded-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Flame size={16} className="text-[#D39858] animate-bounce" />
            <span className="text-xs font-extrabold text-[#D39858] uppercase tracking-widest">
              India's Most Preferred Hardware
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#EACEAA] mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {topBanner?.title || "Architectural Hardware Best Sellers"}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#EACEAA]/80 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            {topBanner?.subtitle ||
              "Precision-crafted handles, hinges, locks, and fittings loved by over 12,000+ architects, interior designers, and homeowners across India."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#best-sellers-grid"
              className="bg-[#D39858] text-[#34150F] font-black px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all duration-300 text-sm shadow-xl active:scale-95 flex items-center gap-2"
            >
              Explore Top Sellers <ArrowRight size={16} />
            </a>
            <button
              onClick={() => {
                setViewMode("ALL20");
                const el = document.getElementById("best-sellers-grid");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#EACEAA]/10 text-[#EACEAA] border border-[#EACEAA]/30 font-bold px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all duration-300 text-sm"
            >
              View Full Catalog (20+)
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: 4 FEATURE ICONS ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-6 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { icon: Award, label: "Top Rated Product", sub: "Rated 4.9/5 by 12k+ users" },
            { icon: Truck, label: "Pan India Delivery", sub: "Fast express logistics" },
            { icon: ShieldCheck, label: "Industry Trusted", sub: "15+ years of excellence" },
            { icon: Lock, label: "Secure Checkout", sub: "GST invoice included" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center p-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-tr-xl rounded-bl-xl bg-[#34150F] flex items-center justify-center mb-2 shadow-sm">
                <Icon size={20} className="text-[#D39858]" />
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#34150F]">{label}</h4>
              <p className="text-[10px] text-[#85431E]/70 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT CONTAINER ═══════════════ */}
      <div id="best-sellers-grid" className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">

        {/* ═══════════════ SECTION 3: FILTERS BAR ═══════════════ */}
        <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 sm:p-6 border border-[rgba(52,21,15,0.08)] shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-[#D39858]" />
            <h3 className="text-sm font-extrabold text-[#34150F] uppercase tracking-wider">
              Filter Best Sellers
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products..."
                className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/50 pl-8 pr-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-semibold truncate"
            >
              <option value="ALL">All Categories</option>
              <option value="HANDLES">Handles</option>
              <option value="HINGES">Hinges</option>
              <option value="LOCKS">Locks</option>
              <option value="KNOBS">Knobs</option>
              <option value="TRACKS">Tracks</option>
            </select>

            {/* Price Range */}
            <select
              value={priceRange}
              onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-semibold truncate"
            >
              <option value="ALL">All Price Ranges</option>
              <option value="UNDER_200">Under ₹200</option>
              <option value="200_500">₹200 – ₹500</option>
              <option value="OVER_500">Over ₹500</option>
            </select>

            {/* Rating */}
            <select
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-semibold truncate"
            >
              <option value="ALL">All Ratings</option>
              <option value="4">4★ & Above</option>
            </select>

            {/* In Stock toggle */}
            <label className="flex items-center gap-2 bg-[#EACEAA] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] cursor-pointer select-none font-semibold text-[#34150F]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#34150F] rounded"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* ═══════════════ SECTION 4: BEST SELLER PRODUCTS GRID ═══════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              {viewMode === "TOP4" ? "Top 4 Best Sellers" : "Best Seller Products"}
            </h2>
            <p className="text-xs text-[#85431E] mt-0.5">
              Showing {displayedProducts.length} of {filteredProducts.length} items
            </p>
          </div>

          {viewMode === "ALL20" && (
            <button
              onClick={() => { setViewMode("TOP4"); setPage(1); }}
              className="text-xs font-bold text-[#85431E] hover:text-[#34150F] underline"
            >
              ← Show Top 4 Only
            </button>
          )}
        </div>

        {displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[rgba(52,21,15,0.08)]">
            <Package size={40} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No products match filters</h3>
            <p className="text-xs text-[#85431E]">Try clearing filters or adjusting your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
            {displayedProducts.map((product, idx) => {
              const rank = (page - 1) * ITEMS_PER_PAGE + idx + 1;
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

              return (
                <div
                  key={product.id}
                  className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Thumbnail + Tags */}
                    <div className="relative">
                      <ProductThumb src={product.image} name={product.name} />

                      {/* BEST SELLER TAG */}
                      <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow flex items-center gap-1">
                        <Flame size={11} className="fill-[#D39858]" />
                        BEST SELLER #{rank}
                      </span>

                      {/* Wishlist button */}
                      <button
                        type="button"
                        onClick={() => onWishlist(product)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm shadow flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                          isWishlisted ? "bg-red-50 text-red-500" : "bg-white/80 text-[#34150F] hover:bg-white"
                        }`}
                        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart size={15} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
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
                        <span className="text-[10px] text-[#85431E]/60 font-semibold">
                          ({product.rating || 5}.0)
                        </span>
                      </div>

                      {/* Price */}
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
                        {effective.isB2B ? (
                          <span className="text-[9px] font-black text-[#34150F] bg-[#D39858] px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            B2B {discountPercent}% OFF
                          </span>
                        ) : discountPercent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {discountPercent}% OFF
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
        )}

        {/* ═══════════════ SECTION 5: VIEW ALL PRODUCTS BUTTON + PAGINATION ═══════════════ */}
        {viewMode === "TOP4" && filteredProducts.length > 4 && (
          <div className="text-center my-8">
            <button
              type="button"
              onClick={() => { setViewMode("ALL20"); setPage(1); }}
              className="bg-[#34150F] text-[#EACEAA] font-black px-10 py-4 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all duration-300 text-sm shadow-lg active:scale-95 inline-flex items-center gap-2"
            >
              View All Best Sellers ({filteredProducts.length} Items) <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Pagination Bar (when in ALL20 view mode) */}
        {viewMode === "ALL20" && totalPages > 1 && (
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

      {/* ═══════════════ SECTION 6: MID-PAGE BANNER (1/2 SCREEN HEIGHT) ═══════════════ */}
      <section className="relative h-[40vh] min-h-[300px] bg-[#34150F] my-12 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              midBanner?.image ||
              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=600&fit=crop&auto=format"
            }
            alt="Mid Page Banner"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/75 via-[#34150F]/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-3xl px-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#EACEAA] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {midBanner?.title || "Built with Precision. Designed for Distinction."}
          </h2>
          <p className="text-xs sm:text-sm text-[#EACEAA]/70 max-w-xl mx-auto mb-6">
            {midBanner?.subtitle ||
              "Discover our complete architectural range crafted from 304 & 316 marine-grade steel, solid brass, and anodized aluminum."}
          </p>
          <Link
            to="/request-quote"
            className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] font-black px-7 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs uppercase tracking-wider"
          >
            Request B2B Bulk Quote →
          </Link>
        </div>
      </section>

      {/* ═══════════════ SECTION 7: WHY CUSTOMERS LOVED THESE PRODUCTS (AUTO-MOVING SLIDER) ═══════════════ */}
      <section className="py-14 bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.08)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 mb-8 text-center">
          <p className="text-[#D39858] text-xs font-extrabold uppercase tracking-[0.2em] mb-1">
            Real Reviews
          </p>
          <h2
            className="text-3xl font-bold text-[#34150F]"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            WHY CUSTOMERS LOVED THESE PRODUCTS
          </h2>
        </div>

        {/* Single Row 5-Card Auto-Slider / Marquee */}
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-5 animate-marquee whitespace-normal hover:[animation-play-state:paused]">
            {[...REVIEWS, ...REVIEWS].map((rev, i) => (
              <div
                key={i}
                className="w-72 sm:w-80 flex-shrink-0 bg-[#f5e8d4] p-5 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm"
              >
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="#D39858" stroke="#D39858" />
                  ))}
                </div>
                <p className="text-xs text-[#85431E] leading-relaxed mb-4 italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="border-t border-[rgba(52,21,15,0.08)] pt-3 flex justify-between items-baseline">
                  <div>
                    <p className="text-xs font-extrabold text-[#34150F]">{rev.name}</p>
                    <p className="text-[10px] text-[#85431E]/60">{rev.role}</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓ Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 8: LIVE STATS COUNTER ═══════════════ */}
      <section className="py-14 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto bg-[#34150F] rounded-tr-3xl rounded-bl-3xl p-8 sm:p-10 shadow-2xl text-center grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              50,000+
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Products Sold
            </p>
          </div>
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              12,000+
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Happy Customers
            </p>
          </div>
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              4.9 ★
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Average Rating
            </p>
          </div>
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              98%
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Customer Satisfaction
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 9: CUSTOMERS WHO BOUGHT THIS ALSO PURCHASED ═══════════════ */}
      <section className="py-12 max-w-6xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#D39858] text-xs font-extrabold uppercase tracking-widest mb-1">
              Frequently Paired
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              CUSTOMERS WHO BOUGHT THIS ALSO PURCHASED
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors hidden sm:block"
          >
            View All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {RELATED_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onWishlist={onWishlist}
              wishlisted={
                wishlist.has(product.id) ||
                wishlist.has(String(product.id)) ||
                ((product as any).apiId ? wishlist.has((product as any).apiId) : false)
              }
            />
          ))}
        </div>
      </section>

      {/* ═══════════════ SECTION 10: WHY BUY FROM PRC HARDWARE ═══════════════ */}
      <section className="bg-[#34150F] text-[#EACEAA] py-16 px-4 md:px-8 lg:px-16 border-t border-[#D39858]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Sparkles size={24} className="text-[#D39858] mx-auto mb-2" />
            <h2
              className="text-3xl font-bold text-[#EACEAA] mb-3"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              WHY BUY FROM PRC HARDWARE
            </h2>
            <p className="text-xs sm:text-sm text-[#EACEAA]/70 leading-relaxed">
              We bridge the gap between premium architectural hardware manufacturing and your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                icon: Award,
                title: "100% Certified Raw Materials",
                desc: "Grade 304/316 stainless steel, solid brass, and die-cast zinc built for extreme durability.",
              },
              {
                icon: ThumbsUp,
                title: "Direct Factory Pricing",
                desc: "No middlemen markups. Get retail or wholesale pricing direct from our warehouses.",
              },
              {
                icon: Truck,
                title: "Rapid Pan-India Logistics",
                desc: "Express dispatch within 24 hours with live order tracking straight to your location.",
              },
              {
                icon: ShieldCheck,
                title: "7-Day Easy Returns & Warranty",
                desc: "Comprehensive quality warranty on all hardware fittings with zero-hassle replacement.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[#EACEAA]/8 border border-[#EACEAA]/12 rounded-tr-2xl rounded-bl-2xl p-6 hover:bg-[#EACEAA]/15 transition-all"
              >
                <div className="w-12 h-12 rounded-tr-xl rounded-bl-xl bg-[#D39858] flex items-center justify-center mx-auto mb-4 text-[#34150F] shadow-lg">
                  <Icon size={22} />
                </div>
                <h4
                  className="text-sm font-bold text-[#EACEAA] mb-2"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  {title}
                </h4>
                <p className="text-xs text-[#EACEAA]/65 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
