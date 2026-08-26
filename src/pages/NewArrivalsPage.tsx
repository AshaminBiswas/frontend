import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Truck, ShieldCheck, Lock, Search,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, Tag, ArrowRight, Award, Flame,
  RefreshCw, Building2
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

const ARCHITECT_REVIEWS = [
  { id: 1, name: "Karan Verma", role: "Principal Architect, Chandigarh", rating: 5, comment: "The matte black T-bar series is stunning. Installed them in a luxury penthouse and the client was thrilled." },
  { id: 2, name: "Meera Deshmukh", role: "Interior Stylist, Delhi", rating: 5, comment: "Fresh 2026 designs that you don't find in local markets. The concealed fittings are ultra smooth." },
  { id: 3, name: "Aman Gupta", role: "Builder, Hyderabad", rating: 5, comment: "New arrivals arrived within 48 hours in perfect packaging. Exceptional quality control." },
  { id: 4, name: "Divya Nair", role: "Studio Lead, Kochi", rating: 5, comment: "Really impressed by PRC Hardware's new catalog and contract wholesale rates." },
  { id: 5, name: "Tushar Saxena", role: "Hotel Project Manager, Jaipur", rating: 5, comment: "Ordered sample sets of the new hardware line. Finishing is international standard." },
];

interface NewArrivalsPageProps {
  onAddToCart: (product: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function NewArrivalsPage({ onAddToCart, onWishlist, wishlist }: NewArrivalsPageProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [priceSort, setPriceSort] = useState("NEWEST");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [viewMode, setViewMode] = useState<"TOP4" | "ALL20">("TOP4");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [addedIds, setAddedIds] = useState<Set<number | string>>(new Set());

  const loadProducts = () => {
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
    loadProducts();
    const unsubscribe = subscribeToProductSync(loadProducts);

    // Fetch Banners
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

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter for new drops: strictly products marked isNewArrival or with new tag
  const newArrivalList = useMemo(() => {
    return products.filter(
      (p) => Boolean(p.isNewArrival) || (Array.isArray(p.tags) && p.tags.includes("new"))
    );
  }, [products]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(String(p.category));
    });
    return [{ id: "ALL", label: "All New Drops" }, ...Array.from(set).map((c) => ({ id: c, label: c }))];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let result = newArrivalList.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (selectedCat !== "ALL") {
        const catStr = String(p.category || "").toLowerCase();
        if (!catStr.includes(selectedCat.toLowerCase())) return false;
      }
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;
      return true;
    });

    return result.sort((a, b) => {
      const priceA = getEffectivePrice(a, user, 1, b2bCache).unitPrice;
      const priceB = getEffectivePrice(b, user, 1, b2bCache).unitPrice;
      if (priceSort === "LOW_HIGH") return priceA - priceB;
      if (priceSort === "HIGH_LOW") return priceB - priceA;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [newArrivalList, search, selectedCat, inStockOnly, priceSort, user, b2bCache]);

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
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ TOP HERO BANNER ═══════════════ */}
      <section className="relative h-[65vh] min-h-[460px] bg-[#34150F] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={
              topBanner?.image ||
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&auto=format"
            }
            alt="New Arrivals Banner"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/90 via-[#34150F]/50 to-black/30" />
        </div>

        <div className="relative z-10 max-w-4xl px-4 sm:px-8">
          <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={16} className="text-[#D39858]" />
            <span className="text-xs font-extrabold text-[#D39858] uppercase tracking-widest">
              Fresh 2026 Collection
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#EACEAA] mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {topBanner?.title || "New Arrival Hardware Collections"}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#EACEAA]/80 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            {topBanner?.subtitle ||
              "Explore our newest commercial architectural fittings engineered for modern interiors, cubicles, and wholesale projects."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#new-arrivals-grid"
              className="bg-[#D39858] text-[#34150F] font-black px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all duration-300 text-sm shadow-xl active:scale-95 flex items-center gap-2"
            >
              Shop New Drops <ArrowRight size={16} />
            </a>
            <button
              onClick={() => {
                setViewMode("ALL20");
                const el = document.getElementById("new-arrivals-grid");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#EACEAA]/10 text-[#EACEAA] border border-[#EACEAA]/30 font-bold px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all duration-300 text-sm"
            >
              View Full Catalog ({products.length})
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 FEATURE BADGES BAR ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-5 px-4 md:px-8 lg:px-16 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { icon: Sparkles, label: "Just Launched", sub: "Fresh 2026 architectural trends" },
            { icon: Truck, label: "Fast Pan-India Delivery", sub: "Dispatched within 24-48 hours" },
            { icon: Tag, label: "Direct Factory Pricing", sub: "Retail & B2B contract rates" },
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

      {/* ═══════════════ MAIN PRODUCT SECTION (SECTION 1) ═══════════════ */}
      <div id="new-arrivals-grid" className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">

        {/* ── Category Pills Filter Bar ── */}
        <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto touch-pan-x pb-3 mb-6 scrollbar-none">
          {categories.map((cat) => (
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
              Displaying {displayedProducts.length} of {filteredProducts.length} items
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
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#85431E]">Loading new arrivals...</span>
          </div>
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

                      {/* NEW TAG */}
                      <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow flex items-center gap-1">
                        <Sparkles size={11} className="text-[#D39858]" />
                        NEW DROP
                      </span>

                      {/* Wishlist Button */}
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

                    {/* Product Details */}
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

      {/* ═══════════════ SECTION 2: RECOMMENDED PAIRINGS & MORE COLLECTIONS ═══════════════ */}
      {recommendedPairings.length > 0 && (
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

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {recommendedPairings.map((product) => {
              const isAdded = addedIds.has(product.id);
              const effective = getEffectivePrice(product, user, 1, b2bCache);
              return (
                <div
                  key={product.apiId || product.id}
                  className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between"
                >
                  <div>
                    <ProductThumb src={product.image} name={product.name} />
                    <p className="text-[9px] font-bold text-[#85431E]/70 uppercase tracking-wider mt-3 mb-1">
                      {product.category}
                    </p>
                    <Link to={`/product/${product.slug || (product as any).apiId || product.id}`}>
                      <h4 className="text-xs font-bold text-[#34150F] line-clamp-2 hover:text-[#D39858] mb-2">
                        {product.name}
                      </h4>
                    </Link>
                    <p
                      className="text-base font-black text-[#34150F] mb-3"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      ₹{effective.unitPrice.toLocaleString("en-IN")}
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
      )}

      {/* ═══════════════ MID BANNER ═══════════════ */}
      {midBanner && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 mb-16">
          <div className="relative rounded-tr-3xl rounded-bl-3xl overflow-hidden bg-[#34150F] p-8 sm:p-12 text-center text-[#EACEAA] border border-[#D39858]/30 shadow-xl">
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
                Wholesale & Contract Solutions
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
        </div>
      )}

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
              Precision manufacturing, Grade 304/316 raw materials, and enterprise B2B support.
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
                icon: Flame,
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
                <h3
                  className="text-sm font-bold text-[#EACEAA] mb-2"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  {title}
                </h3>
                <p className="text-xs text-[#EACEAA]/65 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
