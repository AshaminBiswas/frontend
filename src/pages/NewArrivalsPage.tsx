import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Truck, ShieldCheck, Lock, Search, Filter,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, Tag, Clock, ArrowRight, Award, Flame,
  RefreshCw
} from "lucide-react";
import { Product } from "../types";
import {
  SUPER_SAVER_PRODUCTS,
  VALUE_MONEY_PRODUCTS,
  BEST_SELLER_PRODUCTS
} from "../data/products";
import { bannerService, Banner } from "../services/bannerService";
import { fetchApi } from "../services/api";
import { ProductGridSkeleton } from "../components/common/Skeletons";

// Fallback master catalog
const LOCAL_CATALOG: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

/* ── Safe Image Thumbnail ── */
function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-[#34150F]/20 via-[#D39858]/10 to-[#85431E]/20 flex items-center justify-center border-b border-[#34150F]/8">
        <Package size={36} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <div className="w-full h-52 sm:h-56 overflow-hidden bg-[#EACEAA]/20 border-b border-[#34150F]/8 relative group">
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

const CATEGORIES = [
  { id: "ALL", label: "All New Drops" },
  { id: "HANDLES", label: "Door & Cabinet Handles" },
  { id: "HINGES", label: "Soft-Close Hinges" },
  { id: "LOCKS", label: "Smart & Digital Locks" },
  { id: "KNOBS", label: "Decorative Knobs" },
];

const ARCHITECT_REVIEWS = [
  { id: 1, name: "Karan Verma", role: "Principal Architect, Chandigarh", rating: 5, comment: "The matte black T-bar series is stunning. Installed them in a luxury penthouse and the client was thrilled." },
  { id: 2, name: "Meera Deshmukh", role: "Interior Stylist, Delhi", rating: 5, comment: "Fresh 2026 designs that you don't find in local markets. The concealed hinges are ultra smooth." },
  { id: 3, name: "Aman Gupta", role: "Builder, Hyderabad", rating: 5, comment: "New arrivals arrived within 48 hours in perfect packaging. Exceptional quality control." },
  { id: 4, name: "Divya Nair", role: "Studio Lead, Kochi", rating: 5, comment: "The smart digital lock is ultra responsive. Really impressed by PRC Hardware's new catalog." },
  { id: 5, name: "Tushar Saxena", role: "Hotel Project Manager, Jaipur", rating: 5, comment: "Ordered sample sets of the new brass handles. Finishing is international standard." },
];

interface NewArrivalsPageProps {
  onAddToCart: (product: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function NewArrivalsPage({ onAddToCart, onWishlist, wishlist }: NewArrivalsPageProps) {
  const [products, setProducts] = useState<Product[]>(LOCAL_CATALOG);
  const [loading, setLoading] = useState(false);

  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [priceSort, setPriceSort] = useState("NEWEST");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [viewMode, setViewMode] = useState<"TOP4" | "ALL20">("TOP4");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Fetch API products + banners
  useEffect(() => {
    setLoading(true);
    // 1. Fetch products from API (fallback to LOCAL_CATALOG if empty or offline)
    fetchApi<{ products: Product[] }>("/products?isNewArrival=true")
      .then((res) => {
        if (res.success && res.data && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        } else {
          // Fallback to local
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

    // 2. Fetch Banners
    bannerService
      .getPublicBanners("NEW_ARRIVALS_TOP")
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) setTopBanner(res.data[0]);
      })
      .catch(() => {});

    bannerService
      .getPublicBanners("NEW_ARRIVALS_MID")
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) setMidBanner(res.data[0]);
      })
      .catch(() => {});
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (selectedCat !== "ALL") {
        const cat = p.category?.toUpperCase() || "";
        if (!cat.includes(selectedCat.toUpperCase())) return false;
      }
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;
      return true;
    });

    if (priceSort === "LOW_HIGH") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === "HIGH_LOW") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, selectedCat, priceSort, inStockOnly]);

  const displayedProducts = useMemo(() => {
    if (viewMode === "TOP4") {
      return filteredProducts.slice(0, 4);
    } else {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredProducts, viewMode, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const recommendedPairings = useMemo(() => {
    return products.slice(1, 5);
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

  const highlightProduct = products[0] || LOCAL_CATALOG[0];

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ LUXURY HERO SECTION ═══════════════ */}
      <section className="relative min-h-[65vh] bg-[#34150F] flex items-center justify-center overflow-hidden py-16 px-4 md:px-8 lg:px-16">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              topBanner?.image ||
              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=900&fit=crop&auto=format"
            }
            alt="New Arrivals Hero"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/75 via-[#34150F]/40 to-black/20" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D39858]/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#85431E]/20 blur-3xl" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-3.5 py-1.5 rounded-full mb-5 shadow-lg">
              <Sparkles size={15} className="text-[#D39858] animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-[11px] font-black text-[#D39858] uppercase tracking-[0.2em]">
                2026 Spring Drop • Limited Inventory
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#EACEAA] mb-4 tracking-tight leading-[1.1]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              {topBanner?.title || "Fresh Arrivals & Modern Fittings"}
            </h1>

            <p className="text-sm sm:text-base text-[#EACEAA]/75 max-w-xl mb-8 leading-relaxed font-medium">
              {topBanner?.subtitle ||
                "Elevate your living space with our newest release — satin-brushed brass handles, silent soft-close concealed hinges, and biometric digital locks."}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#new-arrivals-grid"
                className="bg-[#D39858] text-[#34150F] font-black px-7 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all duration-300 text-sm shadow-xl active:scale-95 flex items-center gap-2"
              >
                Explore New Drops <ArrowRight size={16} />
              </a>
              <button
                onClick={() => {
                  setViewMode("ALL20");
                  const el = document.getElementById("new-arrivals-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#EACEAA]/10 text-[#EACEAA] border border-[#EACEAA]/25 font-bold px-7 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all text-sm backdrop-blur-xs"
              >
                View Full Catalog ({products.length})
              </button>
            </div>
          </div>

          {/* Right Column */}
          {highlightProduct && (
            <div className="lg:col-span-5 hidden lg:block">
              <div className="bg-[#EACEAA]/8 border border-[#EACEAA]/15 backdrop-blur-md rounded-tr-3xl rounded-bl-3xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EACEAA]/10">
                  <span className="text-xs font-black uppercase tracking-widest text-[#D39858] flex items-center gap-1.5">
                    <Flame size={14} className="fill-[#D39858]" /> Highlight of the Week
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    NEW ARRIVAL
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  <img
                    src={highlightProduct.image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format"}
                    alt={highlightProduct.name}
                    className="w-24 h-24 object-cover rounded-tr-2xl rounded-bl-2xl border border-[#D39858]/40 shadow-lg flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#EACEAA] leading-snug mb-1">
                      {highlightProduct.name}
                    </h4>
                    <p className="text-[11px] text-[#EACEAA]/60 mb-2">
                      {highlightProduct.material || "304 Grade Solid Brass"}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-[#D39858]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        ₹{highlightProduct.price.toLocaleString("en-IN")}
                      </span>
                      {highlightProduct.originalPrice && (
                        <span className="text-xs text-[#EACEAA]/40 line-through">
                          ₹{highlightProduct.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ═══════════════ 4 FEATURE BADGES BAR ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-5 px-4 md:px-8 lg:px-16 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { icon: Sparkles, label: "Just Launched", sub: "Fresh 2026 architectural trends" },
            { icon: Truck, label: "Fast Pan-India Delivery", sub: "Dispatched within 24-48 hours" },
            { icon: Tag, label: "Launch Discounts", sub: "Special introductory prices" },
            { icon: ShieldCheck, label: "Quality Certified", sub: "Grade 304/316 Steel & Solid Brass" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-tr-xl rounded-bl-xl bg-[#EACEAA]/30 hover:bg-[#EACEAA]/60 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-tr-lg rounded-bl-lg bg-[#34150F] flex items-center justify-center flex-shrink-0 shadow-sm">
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

      {/* ═══════════════ MAIN PRODUCT SECTION ═══════════════ */}
      <div id="new-arrivals-grid" className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">

        {/* ── Category Pills Filter Bar ── */}
        <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto touch-pan-x pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCat(cat.id); setPage(1); }}
              className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCat === cat.id
                  ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Filters & Search Control Bar ── */}
        <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 border border-[rgba(52,21,15,0.08)] shadow-sm mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search new drops..."
                className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/50 pl-8 pr-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
            </div>

            {/* Sort order */}
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold truncate"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="LOW_HIGH">Price: Low to High</option>
              <option value="HIGH_LOW">Price: High to Low</option>
            </select>

            {/* In Stock toggle */}
            <label className="flex items-center gap-2 bg-[#EACEAA] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] cursor-pointer select-none font-bold text-[#34150F]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#34150F] rounded"
              />
              <span>In Stock Items Only</span>
            </label>

            {/* Clear filters button */}
            {(search || selectedCat !== "ALL" || inStockOnly || priceSort !== "NEWEST") && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSelectedCat("ALL"); setInStockOnly(false); setPriceSort("NEWEST"); setPage(1); }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-2"
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ── Product Grid Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              {viewMode === "TOP4" ? "New Drop Highlights" : "All New Arrivals"}
            </h2>
            <p className="text-xs text-[#85431E] mt-0.5">
              Displaying {displayedProducts.length} of {filteredProducts.length} new items
            </p>
          </div>

          {viewMode === "ALL20" && (
            <button
              onClick={() => { setViewMode("TOP4"); setPage(1); }}
              className="text-xs font-bold text-[#85431E] hover:text-[#34150F] underline"
            >
              ← Show Highlights Only
            </button>
          )}
        </div>

        {/* ── Products Grid ── */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-sm">
            <Package size={42} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No products match your filters</h3>
            <p className="text-xs text-[#85431E]">Try selecting another category or clear your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
            {displayedProducts.map((product) => {
              const isAdded = addedIds.has(product.id);
              const isWishlisted =
                wishlist.has(product.id) ||
                wishlist.has(String(product.id)) ||
                ((product as any).apiId ? wishlist.has((product as any).apiId) : false);
              const discountPercent =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : product.discount || 0;

              return (
                <div
                  key={product.id}
                  className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Thumbnail + Badges */}
                    <div className="relative">
                      <ProductThumb src={product.image} name={product.name} />

                      {/* NEW ARRIVAL FLOATING BADGE */}
                      <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow-md flex items-center gap-1 border border-[#D39858]/30">
                        <Sparkles size={10} className="fill-[#D39858] text-[#D39858]" />
                        JUST LAUNCHED
                      </span>

                      {/* Wishlist toggle */}
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
                        <span className="text-[10px] text-[#85431E]/60 font-bold">
                          ({product.rating || 5}.0)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-lg font-black text-[#34150F]"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-[#85431E]/50 line-through font-semibold">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {discountPercent}% OFF
                          </span>
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

        {/* ── View All CTA / Pagination Bar ── */}
        {viewMode === "TOP4" && filteredProducts.length > 4 && (
          <div className="text-center my-10">
            <button
              type="button"
              onClick={() => { setViewMode("ALL20"); setPage(1); }}
              className="bg-[#34150F] text-[#EACEAA] font-black px-10 py-4 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all duration-300 text-sm shadow-xl active:scale-95 inline-flex items-center gap-2"
            >
              View All New Arrivals ({filteredProducts.length} Items) <ArrowRight size={16} />
            </button>
          </div>
        )}

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

      {/* ═══════════════ MID-PAGE SHOWCASE BANNER ═══════════════ */}
      <section className="relative h-[42vh] min-h-[320px] bg-[#34150F] my-12 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              midBanner?.image ||
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=600&fit=crop&auto=format"
            }
            alt="Mid Banner"
            className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/75 via-[#34150F]/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-3xl px-4">
          <span className="text-[10px] font-black text-[#D39858] uppercase tracking-[0.25em] mb-2 inline-block">
            Architect & Builder Special
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#EACEAA] mb-3 leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {midBanner?.title || "Innovative Hardware For Modern Living"}
          </h2>
          <p className="text-xs sm:text-sm text-[#EACEAA]/70 max-w-xl mx-auto mb-6">
            {midBanner?.subtitle ||
              "Request custom sample kits or B2B bulk volume pricing for commercial and luxury residential projects."}
          </p>
          <Link
            to="/request-quote"
            className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] font-black px-7 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs uppercase tracking-wider shadow-lg"
          >
            Request B2B Quote →
          </Link>
        </div>
      </section>

      {/* ═══════════════ ARCHITECT REVIEWS MARQUEE ═══════════════ */}
      <section className="py-14 bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.08)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 mb-8 text-center">
          <p className="text-[#D39858] text-xs font-extrabold uppercase tracking-[0.2em] mb-1">
            Early Feedback
          </p>
          <h2
            className="text-3xl font-bold text-[#34150F]"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            WHAT ARCHITECTS SAY ABOUT OUR LATEST COLLECTIONS
          </h2>
        </div>

        {/* Marquee slider */}
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-5 animate-marquee whitespace-normal hover:[animation-play-state:paused]">
            {[...ARCHITECT_REVIEWS, ...ARCHITECT_REVIEWS].map((rev, i) => (
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
                  <span className="text-[9px] font-bold text-[#D39858] bg-[#34150F] px-1.5 py-0.5 rounded">
                    ★ Verified Architect
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LAUNCH STATS ═══════════════ */}
      <section className="py-14 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto bg-[#34150F] rounded-tr-3xl rounded-bl-3xl p-8 sm:p-10 shadow-2xl text-center grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              1,200+
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Units In Stock
            </p>
          </div>
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              45+
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              New Designs
            </p>
          </div>
          <div>
            <p
              className="text-3xl sm:text-4xl font-black text-[#D39858] mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              100%
            </p>
            <p className="text-xs font-bold text-[#EACEAA]/80 uppercase tracking-wider">
              Quality Inspected
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
              Early Rating
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ RECOMMENDED PAIRINGS ═══════════════ */}
      <section className="py-12 max-w-6xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#D39858] text-xs font-extrabold uppercase tracking-widest mb-1">
              Curated Pairings
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              FREQUENTLY PAIRED WITH NEW ARRIVALS
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors hidden sm:block"
          >
            Explore Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {recommendedPairings.map((product) => {
            const isAdded = addedIds.has(product.id);
            return (
              <div
                key={product.id}
                className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <ProductThumb src={product.image} name={product.name} />
                  <p className="text-[9px] font-bold text-[#85431E]/70 uppercase tracking-wider mt-3 mb-1">
                    {product.category}
                  </p>
                  <Link to={`/product/${product.id}`}>
                    <h4 className="text-xs font-bold text-[#34150F] line-clamp-2 hover:text-[#D39858] mb-2">
                      {product.name}
                    </h4>
                  </Link>
                  <p
                    className="text-base font-black text-[#34150F] mb-3"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className={`w-full py-2 px-3 rounded-tr-xl rounded-bl-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F]"
                  }`}
                >
                  {isAdded ? <Check size={13} /> : <ShoppingCart size={13} />}
                  {isAdded ? "Added" : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ WHY UPGRADE WITH PRC HARDWARE ═══════════════ */}
      <section className="bg-[#34150F] text-[#EACEAA] py-16 px-4 md:px-8 lg:px-16 border-t border-[#D39858]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Award size={24} className="text-[#D39858] mx-auto mb-2" />
            <h2
              className="text-3xl font-bold text-[#EACEAA] mb-3"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              WHY UPGRADE WITH PRC HARDWARE
            </h2>
            <p className="text-xs sm:text-sm text-[#EACEAA]/70 leading-relaxed">
              Elevate every interior project with precision-engineered fittings, marine-grade materials, and fast pan-India logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                icon: Sparkles,
                title: "Contemporary Aesthetics",
                desc: "Designed in collaboration with top interior architects to complement modern & minimalist interiors.",
              },
              {
                icon: Clock,
                title: "Precision Engineering",
                desc: "Tested for over 200,000 opening cycles with zero sagging or loss of soft-close tension.",
              },
              {
                icon: Truck,
                title: "Next-Day Dispatch",
                desc: "All new arrival inventory is pre-packed and ready for express shipment pan-India.",
              },
              {
                icon: ShieldCheck,
                title: "Complete Quality Warranty",
                desc: "Backing every piece of hardware with our 100% replacement guarantee against manufacturing defects.",
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
