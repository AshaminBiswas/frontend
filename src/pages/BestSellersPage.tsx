import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Award, Truck, ShieldCheck, Lock, Search, Filter,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, Flame, Users, ThumbsUp, ArrowRight, Sparkles, Building2
} from "lucide-react";
import { Product } from "../types";
import { bannerService, Banner } from "../services/bannerService";
import { fetchApi } from "../services/api";
import { subscribeToProductSync } from "../services/productSyncService";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";

function normalizeRawProduct(item: any): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const finalId = item.id !== undefined && item.id !== null ? item.id : (rawId || apiIdStr || "1");

  const backendRegular = Number(item.price || item.regularPrice || item.mrp || item.originalPrice || 0);
  const backendSale = item.offerPrice ?? item.salePrice;

  const effectiveSale = backendSale !== null && backendSale !== undefined && Number(backendSale) > 0
    ? Number(backendSale)
    : Number(item.price || 0);

  const effectiveRegular = backendRegular > 0 ? backendRegular : effectiveSale;

  let image = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop";
  if (typeof item.image === "string" && item.image.trim()) {
    image = item.image;
  } else if (typeof item.thumbnail === "string" && item.thumbnail.trim()) {
    image = item.thumbnail;
  } else if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === "string") {
    image = item.images[0];
  }

  const categoryName = typeof item.category === "object" && item.category?.name
    ? item.category.name
    : (typeof item.category === "string" ? item.category : "Hardware");

  return {
    ...item,
    id: finalId,
    apiId: apiIdStr,
    name: item.name || item.title || "Architectural Hardware",
    category: categoryName,
    price: effectiveSale,
    salePrice: effectiveSale,
    offerPrice: effectiveSale,
    regularPrice: effectiveRegular,
    originalPrice: effectiveRegular,
    discount: item.discount ? Number(item.discount) : (effectiveRegular > effectiveSale ? Math.round(((effectiveRegular - effectiveSale) / effectiveRegular) * 100) : 0),
    image,
    material: item.material || item.specifications?.material || "Stainless Steel / Brass",
    b2bPrice: item.b2bPrice !== undefined ? Number(item.b2bPrice) : (item.b2b_price !== undefined ? Number(item.b2b_price) : undefined),
  };
}

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
  { id: 1, name: "Vikram R.", role: "Architect, Mumbai", rating: 5, comment: "Unmatched finishing and strength. These fittings completely elevated our commercial project." },
  { id: 2, name: "Sneha Kapoor", role: "Interior Stylist, Delhi", rating: 5, comment: "Fast pan-India delivery and 100% genuine stainless steel fittings. PRC Hardware is our permanent vendor." },
  { id: 3, name: "Rohan Patel", role: "Contractor, Ahmedabad", rating: 5, comment: "Heavy duty, zero defects, and amazing bulk B2B contract pricing." },
  { id: 4, name: "Ananya Iyer", role: "Project Manager, Bengaluru", rating: 5, comment: "Precision engineering and dependable fittings. Super satisfied!" },
  { id: 5, name: "Manish Sharma", role: "Builder, Pune", rating: 5, comment: "Exceptional quality and reliable dimensions. Customer support gave great guidance." },
];

export function BestSellersPage({ onAddToCart, onWishlist, wishlist }: BestSellersPageProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();

  // Banners state
  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  // Products state from live API or fallback
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [addedIds, setAddedIds] = useState<Set<number | string>>(new Set());

  // Auto-scroll reviewer carousel
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bannerService.getPublicBanners("BESTSELLERS_TOP").then((res) => {
      if (res && res.data && res.data.length > 0) setTopBanner(res.data[0]);
    }).catch(() => {});

    bannerService.getPublicBanners("BESTSELLERS_MID").then((res) => {
      if (res && res.data && res.data.length > 0) setMidBanner(res.data[0]);
    }).catch(() => {});
  }, []);

  const loadData = () => {
    fetchApi<any>("/products?limit=100")
      .then((res) => {
        if (res && res.success && res.data) {
          const rawList = Array.isArray(res.data.products)
            ? res.data.products
            : Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.items)
            ? res.data.items
            : [];

          if (rawList.length > 0) {
            const normalized = rawList.map(normalizeRawProduct);
            setProducts(normalized);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    return subscribeToProductSync(loadData);
  }, []);

  // Filter products: strictly those marked isBestseller or with bestseller tag
  const bestSellerList = useMemo(() => {
    return products.filter(
      (p) => Boolean(p.isBestseller) || Boolean((p as any).isBestsaller) || (Array.isArray(p.tags) && p.tags.includes("bestseller"))
    );
  }, [products]);

  // Extract unique category names
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(String(p.category));
    });
    return Array.from(set);
  }, [products]);

  // Filtered products based on user controls
  const filteredProducts = useMemo(() => {
    return bestSellerList.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (category !== "ALL" && String(p.category).toUpperCase() !== category.toUpperCase()) return false;
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;
      if (minRating === "4" && (p.rating || 5) < 4) return false;

      const effective = getEffectivePrice(p, user, 1, b2bCache);
      const currentPrice = effective.unitPrice;
      if (priceRange === "UNDER_200" && currentPrice >= 200) return false;
      if (priceRange === "200_500" && (currentPrice < 200 || currentPrice > 500)) return false;
      if (priceRange === "OVER_500" && currentPrice <= 500) return false;
      return true;
    });
  }, [search, category, priceRange, minRating, inStockOnly, bestSellerList, user, b2bCache]);

  // Displayed products based on viewMode & pagination
  const displayedProducts = useMemo(() => {
    if (viewMode === "TOP4") {
      return filteredProducts.slice(0, 4);
    } else {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredProducts, viewMode, page]);

  const relatedProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

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

      {/* ═══════════════ SECTION 1: TOP BANNER ═══════════════ */}
      <section className="relative h-[60vh] min-h-[420px] bg-[#34150F] flex items-center justify-center text-center overflow-hidden">
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
              "Precision-crafted handles, hinges, locks, and fittings trusted by architects, interior designers, and enterprises across India."}
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
              View Full Catalog ({products.length})
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: 4 FEATURE ICONS ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-6 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { icon: Award, label: "Top Rated Product", sub: "Rated 4.9/5 by architects" },
            { icon: Truck, label: "Pan India Delivery", sub: "Fast express logistics" },
            { icon: ShieldCheck, label: "Industry Trusted", sub: "Commercial grade quality" },
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
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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

        {/* ═══════════════ SECTION 4: PRODUCTS GRID ═══════════════ */}
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

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#85431E]">Loading best sellers...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
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
                  key={product.apiId || product.id}
                  onClick={() => navigate(`/product/${product.slug || (product as any).apiId || product.id}`)}
                  className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onWishlist(product);
                        }}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm shadow flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                          isWishlisted ? "bg-red-50 text-red-500" : "bg-white/80 text-[#34150F] hover:bg-white"
                        }`}
                        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart size={15} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2 sm:p-4">
                      <Link to={`/product/${product.slug || (product as any).apiId || product.id}`}>
                        <h3 className="text-[11px] sm:text-sm font-bold text-[#34150F] leading-tight line-clamp-2 hover:text-[#D39858] transition-colors mb-1 min-h-[26px] sm:min-h-[32px]">
                          {product.name}
                        </h3>
                      </Link>

                      {((product as any).shortDesc || product.description) && (
                        <p className="hidden sm:block text-[10px] text-[#85431E]/65 leading-relaxed line-clamp-2 mb-2">
                          {(product as any).shortDesc || product.description}
                        </p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-1.5 sm:mb-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              fill={s <= Math.round(Number(product.rating || 5)) ? "#D39858" : "none"}
                              stroke="#D39858"
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#85431E]/60 font-semibold">
                          ({Number(product.rating || 5.0).toFixed(1)})
                        </span>
                      </div>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap mb-2">
                        <span
                          className="text-xs sm:text-base font-black text-[#34150F]"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          ₹{effective.unitPrice.toLocaleString("en-IN")}
                        </span>
                        {effective.originalPrice > effective.unitPrice && (
                          <span className="text-[9px] sm:text-xs text-[#85431E]/50 line-through font-semibold">
                            ₹{effective.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                        {effective.isB2B ? (
                          <span className="text-[8px] font-black text-[#34150F] bg-[#D39858] px-1 py-0.2 rounded shadow-2xs uppercase tracking-wider flex items-center gap-0.5">
                            <Building2 size={9} /> B2B
                          </span>
                        ) : discountPercent > 0 && (
                          <span className="text-[8px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="p-2 sm:p-4 pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className={`w-full py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs active:scale-95 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
                      }`}
                    >
                      {isAdded ? (
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
              );
            })}
          </div>
        )}

        {/* ═══════════════ SECTION 5: MID-PAGE PROMOTIONAL BANNER ═══════════════ */}
        {midBanner && (
          <div className="relative rounded-tr-3xl rounded-bl-3xl overflow-hidden bg-[#34150F] p-8 sm:p-12 mb-16 text-center text-[#EACEAA] border border-[#D39858]/30 shadow-xl">
            <div className="absolute inset-0 z-0">
              <img
                src={midBanner.image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop"}
                alt="Mid Banner"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#34150F] via-[#34150F]/80 to-[#34150F]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block bg-[#D39858] text-[#34150F] font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                Commercial Enterprise Solution
              </span>
              <h2
                className="text-2xl sm:text-4xl font-bold mb-3"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                {midBanner.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#EACEAA]/80 mb-6 leading-relaxed">
                {midBanner.subtitle}
              </p>
              {midBanner.link && (
                <Link
                  to={midBanner.link}
                  className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] font-bold px-8 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs shadow-lg"
                >
                  Explore Contract Catalog <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ SECTION 6: RELATED PRODUCTS (DYNAMIC) ═══════════════ */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-xl font-bold text-[#34150F]"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  More Hardware Recommendations
                </h3>
                <p className="text-xs text-[#85431E]">Pairs exceptionally well with best selling collections</p>
              </div>
              <Link to="/products" className="text-xs font-bold text-[#85431E] hover:text-[#34150F] flex items-center gap-1">
                View Catalog <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => {
                const effective = getEffectivePrice(p, user, 1, b2bCache);
                return (
                  <div
                    key={p.apiId || p.id}
                    className="bg-[#FAF4ED] p-3 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] flex flex-col justify-between group hover:border-[#D39858]/50 transition-colors"
                  >
                    <div>
                      <div className="w-full h-32 overflow-hidden rounded-tr-lg rounded-bl-lg bg-[#EACEAA]/20 mb-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <Link to={`/product/${(p as any).slug || (p as any).apiId || p.id}`}>
                        <h4 className="text-xs font-bold text-[#34150F] line-clamp-1 hover:text-[#D39858] transition-colors mb-1">
                          {p.name}
                        </h4>
                      </Link>
                      <p className="text-xs font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        ₹{effective.unitPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className="mt-2 w-full py-1.5 bg-[#34150F] text-[#EACEAA] text-[11px] font-bold rounded-tr-md rounded-bl-md hover:bg-[#D39858] hover:text-[#34150F] transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════ SECTION 7: CUSTOMER REVIEWS CAROUSEL ═══════════════ */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold text-[#D39858] uppercase tracking-widest bg-[#34150F] px-3 py-1 rounded-full">
              Client Feedback
            </span>
            <h3
              className="text-2xl font-bold text-[#34150F] mt-2"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Trusted by Architects & Builders Pan-India
            </h3>
          </div>

          <div
            ref={marqueeRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide"
          >
            {REVIEWS.map((r) => (
              <div
                key={r.id}
                className="flex-shrink-0 w-72 bg-[#FAF4ED] p-5 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13} fill="#D39858" stroke="#D39858" />
                    ))}
                  </div>
                  <p className="text-xs text-[#34150F] leading-relaxed italic mb-4">
                    "{r.comment}"
                  </p>
                </div>
                <div className="border-t border-[rgba(52,21,15,0.08)] pt-3">
                  <p className="text-xs font-bold text-[#34150F]">{r.name}</p>
                  <p className="text-[10px] text-[#85431E]/70 font-semibold">{r.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════ SECTION 8: WHY BUY FROM PRC HARDWARE ═══════════════ */}
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
              We bridge the gap between premium architectural hardware manufacturing and your project site.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                icon: Award,
                title: "100% Certified Raw Materials",
                desc: "Grade 304/316 stainless steel, solid brass, and precision fittings engineered for extreme longevity.",
              },
              {
                icon: ThumbsUp,
                title: "Direct Factory Pricing",
                desc: "No middlemen markups. Get retail or wholesale B2B contract pricing direct from manufacturing.",
              },
              {
                icon: Truck,
                title: "Rapid Pan-India Logistics",
                desc: "Express dispatch within 24 hours with live order tracking straight to your location.",
              },
              {
                icon: ShieldCheck,
                title: "Quality Warranty & Easy Support",
                desc: "Comprehensive quality warranty on all hardware fittings with zero-hassle support.",
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
