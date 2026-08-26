import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Tag, Percent, Flame, Clock, Search, Filter,
  Star, ShoppingCart, Heart, ChevronLeft, ChevronRight,
  Package, Check, ShieldCheck, Truck, Copy, Sparkles,
  ArrowRight, RefreshCw, Gift, Zap, Building2, SlidersHorizontal, CheckCircle2, Ticket
} from "lucide-react";
import { Product } from "../types";
import { couponService, Coupon } from "../services/couponService";
import { bannerService, Banner } from "../services/bannerService";
import { fetchApi } from "../services/api";
import { subscribeToProductSync } from "../services/productSyncService";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";

interface OffersPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function OffersPage({ onAddToCart, onWishlist, wishlist }: OffersPageProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [topBanner, setTopBanner] = useState<Banner | null>(null);
  const [midBanner, setMidBanner] = useState<Banner | null>(null);

  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(null);
  const [category, setCategory] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number | string>>(new Set());

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const loadData = () => {
    // 1. Fetch Dynamic Real Coupons from Backend API
    couponService
      .getPublicCoupons()
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          setCoupons(res.data);
        } else {
          setCoupons([]);
        }
      })
      .catch((err) => {
        console.warn("[OffersPage Coupons Load Error]:", err);
        setCoupons([]);
      });

    // 2. Fetch Dynamic Products from Database API
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
  };

  useEffect(() => {
    loadData();
    return subscribeToProductSync(loadData);
  }, []);

  // ── Dynamic Target Product Map for Coupons ──────────────────────────────────
  const couponProductMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    coupons.forEach((c) => {
      const pids = new Set<string>();
      if (Array.isArray(c.applicableProductIds)) {
        c.applicableProductIds.forEach((id) => pids.add(String(id)));
      }
      map.set(c.code, pids);
    });
    return map;
  }, [coupons]);

  // ── Compute Dynamic Filter Tiers from Actual Product Catalog ────────────────
  const dynamicTiers = useMemo(() => {
    let totalOfferCount = 0;
    let count50Plus = 0;
    let count30Plus = 0;
    let count20Plus = 0;
    let count10Plus = 0;
    let countPriceDrop = 0;

    products.forEach((p) => {
      const effective = getEffectivePrice(p, user, 1, b2bCache);
      const discount = effective.isB2B
        ? effective.b2bDiscountPercent
        : effective.originalPrice > effective.unitPrice
        ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
        : p.discount || 0;

      const isMarked = p.isInOffer === true || (Array.isArray(p.tags) && p.tags.some((t: string) => String(t).toLowerCase().includes("offer")));

      if (discount > 0 || isMarked) totalOfferCount++;
      if (discount >= 50) count50Plus++;
      if (discount >= 30) count30Plus++;
      if (discount >= 20) count20Plus++;
      if (discount >= 10) count10Plus++;
      if (effective.unitPrice < effective.originalPrice) countPriceDrop++;
    });

    const tiers = [
      { id: "ALL", label: `All Active Offers (${totalOfferCount || products.length})` },
    ];

    if (count50Plus > 0) tiers.push({ id: "50_PLUS", label: `50%+ OFF Steals (${count50Plus})` });
    if (count30Plus > 0) tiers.push({ id: "30_PLUS", label: `30%+ OFF Deals (${count30Plus})` });
    if (count20Plus > 0) tiers.push({ id: "20_PLUS", label: `20%+ OFF (${count20Plus})` });
    if (count10Plus > 0 && count30Plus === 0) tiers.push({ id: "10_PLUS", label: `10%+ OFF (${count10Plus})` });
    if (countPriceDrop > 0) tiers.push({ id: "PRICE_DROPS", label: `Factory Price Drops (${countPriceDrop})` });

    return tiers;
  }, [products, user, b2bCache]);

  // Extract unique categories
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(String(p.category));
    });
    return Array.from(set);
  }, [products]);

  // Filter products by discount tier, selected coupon, category, and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      if (category !== "ALL" && String(p.category).toUpperCase() !== category.toUpperCase()) return false;
      if (inStockOnly && p.stock !== undefined && p.stock <= 0) return false;

      // If a specific coupon code is selected, check eligibility
      if (selectedCouponCode) {
        const targetIds = couponProductMap.get(selectedCouponCode);
        if (targetIds && targetIds.size > 0) {
          const isEligible = targetIds.has(String(p.id)) || (p.apiId ? targetIds.has(String(p.apiId)) : false);
          if (!isEligible) return false;
        }
      }

      const effective = getEffectivePrice(p, user, 1, b2bCache);
      const discount = effective.isB2B
        ? effective.b2bDiscountPercent
        : effective.originalPrice > effective.unitPrice
        ? Math.round(((effective.originalPrice - effective.unitPrice) / effective.originalPrice) * 100)
        : p.discount || 0;

      if (selectedTier === "50_PLUS" && discount < 50) return false;
      if (selectedTier === "30_PLUS" && discount < 30) return false;
      if (selectedTier === "20_PLUS" && discount < 20) return false;
      if (selectedTier === "10_PLUS" && discount < 10) return false;
      if (selectedTier === "PRICE_DROPS" && effective.unitPrice >= effective.originalPrice) return false;

      return true;
    });
  }, [products, search, category, selectedTier, selectedCouponCode, inStockOnly, user, b2bCache, couponProductMap]);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

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

      {/* ═══════════════ OFFERS HERO BANNER ═══════════════ */}
      <section className="relative min-h-[55vh] bg-gradient-to-br from-[#34150F] via-[#5c2415] to-[#85431E] text-center flex items-center justify-center overflow-hidden py-14 px-4 sm:px-8">
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
          <div className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] px-4 py-1.5 rounded-full mb-4 shadow-lg animate-bounce">
            <Zap size={15} className="fill-[#34150F]" />
            <span className="text-xs font-black uppercase tracking-widest">
              Live Promo Codes & Factory Deals
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
              "Premium architectural hardware, cubicle fittings, and handles at direct manufacturer rates with pan-India delivery."}
          </p>

          {/* Dynamic Real Copyable Promo Codes Bar from Database */}
          {coupons.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {coupons.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCopyCode(c.code)}
                  className="bg-[#EACEAA]/15 border border-[#D39858]/40 hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all flex items-center gap-2 shadow backdrop-blur-sm"
                >
                  <span className="font-mono">{c.code}</span>
                  <span className="text-[10px] opacity-80">
                    ({c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`})
                  </span>
                  {copiedCode === c.code ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34150F]/60 text-[#EACEAA] border border-[#D39858]/30 text-xs font-bold">
              <Sparkles size={14} className="text-[#D39858]" />
              <span>Direct factory discounts automatically applied on all eligible items below</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ DEAL TIERS STRIP ═══════════════ */}
      <section className="bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.1)] py-5 px-4 md:px-8 lg:px-16 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Percent, label: "Direct Factory Pricing", sub: "Super saver catalog" },
            { icon: Zap, label: "B2B Contract Deals", sub: "Wholesale quantity rates" },
            { icon: Truck, label: "Free Shipping @ ₹2,000", sub: "Pan-India express delivery" },
            { icon: ShieldCheck, label: "GST Input Tax Credit", sub: "100% genuine tax invoice" },
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

      {/* ═══════════════ MAIN OFFERS & DEALS CONTENT (100% DYNAMIC) ═══════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">

        {/* ── Dynamic Deal Filter Tabs (Computed from Real Products) ── */}
        <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto touch-pan-x pb-3 mb-6 scrollbar-none">
          {dynamicTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => { setSelectedTier(tier.id); setSelectedCouponCode(null); setPage(1); }}
              className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedTier === tier.id && !selectedCouponCode
                  ? "bg-[#34150F] text-[#D39858] border-transparent shadow-md"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {tier.label}
            </button>
          ))}

          {/* Dynamic Tabs for Active Coupon Codes */}
          {coupons.map((c) => {
            const isSelective = Array.isArray(c.applicableProductIds) && c.applicableProductIds.length > 0;
            const isSelected = selectedCouponCode === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setSelectedCouponCode(isSelected ? null : c.code);
                  setSelectedTier("ALL");
                  setPage(1);
                }}
                className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#85431E] text-white border-transparent shadow-md"
                    : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858]"
                }`}
              >
                <Tag size={13} />
                <span>Code: {c.code}</span>
                {isSelective && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D39858] text-[#34150F] font-extrabold">
                    Targeted
                  </span>
                )}
              </button>
            );
          })}
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
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
            {(search || selectedTier !== "ALL" || selectedCouponCode || category !== "ALL" || inStockOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedTier("ALL");
                  setSelectedCouponCode(null);
                  setCategory("ALL");
                  setInStockOnly(false);
                  setPage(1);
                }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-2"
              >
                <RefreshCw size={13} /> Reset All Filters
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
              {selectedCouponCode ? `Items Eligible for Coupon "${selectedCouponCode}"` : "Active Special Offers"}
            </h2>
            <p className="text-xs text-[#85431E] mt-0.5">
              Showing {displayedProducts.length} of {filteredProducts.length} deal items
            </p>
          </div>
        </div>

        {/* ── Offer Products Grid (DYNAMIC PRODUCT CARDS) ── */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#85431E]">Loading special offers...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-sm">
            <Package size={42} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No offer products match selected criteria</h3>
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
                  key={product.apiId || product.id}
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

                    {/* Details */}
                    <div className="p-2 sm:p-4">
                      <span className="text-[9px] font-black uppercase text-[#85431E] block mb-1">
                        {product.category}
                      </span>
                      <Link to={`/product/${product.slug || (product as any).apiId || product.id}`}>
                        <h3 className="text-[11px] sm:text-sm font-bold text-[#34150F] hover:text-[#85431E] transition-colors line-clamp-2 mb-1 min-h-[26px] sm:min-h-[32px]">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price Section */}
                      <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs sm:text-base font-black text-[#34150F]">
                          ₹{effective.unitPrice.toLocaleString("en-IN")}
                        </span>
                        {effective.originalPrice > effective.unitPrice && (
                          <span className="text-[9px] sm:text-xs text-[#85431E]/60 line-through">
                            ₹{effective.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {savingsRupees > 0 && (
                        <p className="text-[9px] sm:text-[10px] text-emerald-700 font-bold mb-2">
                          Save ₹{savingsRupees.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="p-2 sm:p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className={`w-full py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 ${
                        isAdded
                          ? "bg-emerald-700 text-white"
                          : "bg-[#34150F] hover:bg-[#85431E] text-[#EACEAA]"
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

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-12">
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

      {/* ═══════════════ DYNAMIC PROMO CODES & COUPONS GRID (LIVE FROM BACKEND DATABASE) ═══════════════ */}
      <section className="py-14 bg-[#FAF4ED] border-y border-[rgba(52,21,15,0.08)] px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Gift size={28} className="text-[#D39858] mx-auto mb-2" />
            <h2
              className="text-3xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              ACTIVE PROMOTIONS & VOUCHERS
            </h2>
            <p className="text-xs sm:text-sm text-[#85431E] mt-1">
              Tap any coupon code below to copy it for instant application at checkout.
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[rgba(52,21,15,0.1)] max-w-lg mx-auto shadow-sm">
              <Ticket size={36} className="text-[#85431E]/40 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#34150F]">No voucher codes active at the moment</h4>
              <p className="text-xs text-[#85431E] mt-1">
                Direct factory discounts are already applied to all promotional items in the catalog above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coupons.map((c) => {
                const isSelective = Array.isArray(c.applicableProductIds) && c.applicableProductIds.length > 0;
                return (
                  <div
                    key={c.code}
                    className="bg-[#f5e8d4] p-6 rounded-tr-2xl rounded-bl-2xl border-2 border-dashed border-[#D39858]/60 relative flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-[#34150F] bg-[#D39858]/30 px-2.5 py-1 rounded flex items-center gap-1">
                          <Percent size={12} />
                          {c.discountType === "PERCENTAGE"
                            ? `${c.discountValue}% OFF`
                            : `₹${c.discountValue} FLAT OFF`}
                        </span>
                        {c.minOrderAmount ? (
                          <span className="text-[10px] text-[#85431E]/80 font-bold">
                            Min Order: ₹{Number(c.minOrderAmount).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold">No Min Order</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-black text-sm text-[#34150F] bg-[#EACEAA] px-2 py-0.5 rounded border border-[#34150F]/20">
                          {c.code}
                        </span>
                        {isSelective && (
                          <span className="text-[9px] bg-amber-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Selective Products
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#85431E] leading-relaxed mb-4">
                        {c.description || `Use promo code ${c.code} to save on your architectural hardware order.`}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#34150F]/10">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        className="w-full bg-[#34150F] text-[#EACEAA] font-bold py-2.5 px-4 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-xs flex items-center justify-center gap-2 shadow"
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

                      {isSelective && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCouponCode(selectedCouponCode === c.code ? null : c.code);
                            window.scrollTo({ top: 600, behavior: "smooth" });
                          }}
                          className="w-full text-center text-[11px] font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-1"
                        >
                          {selectedCouponCode === c.code ? "Show All Items" : "View Eligible Items Above ↑"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ MID BANNER / WHOLESALE ═══════════════ */}
      {midBanner ? (
        <div className="max-w-6xl mx-auto px-4 md:px-8 my-16">
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
                Bulk Order Advantage
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
      ) : (
        <section className="relative h-[38vh] min-h-[280px] bg-[#34150F] my-12 flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=600&fit=crop&auto=format"
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
              Contractor & Bulk Architect Deals
            </h2>
            <p className="text-xs sm:text-sm text-[#EACEAA]/70 max-w-xl mx-auto mb-6">
              Unlock specialized trade pricing, custom hardware manufacturing, and tax input invoices for commercial site orders.
            </p>
            <Link
              to="/request-quote"
              className="inline-flex items-center gap-2 bg-[#D39858] text-[#34150F] font-black px-7 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs uppercase tracking-wider shadow-lg"
            >
              Request Wholesale Quote →
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
