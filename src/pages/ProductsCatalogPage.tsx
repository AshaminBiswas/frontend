import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search, Filter, SlidersHorizontal, ShoppingCart, Heart, ArrowUpDown,
  Building2, Eye, Sparkles, Check, Package, X, RefreshCw, ChevronLeft,
  ChevronRight, Star, Flame, ShieldCheck, Truck, Layers
} from "lucide-react";
import { Product } from "../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../data/products";
import { QuickViewModal } from "../components/product/QuickViewModal";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { fetchApi } from "../services/api";
import { ProductGridSkeleton } from "../components/common/Skeletons";

const LOCAL_PRODUCTS: Product[] = [
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

interface ProductsCatalogPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function ProductsCatalogPage({ onAddToCart, onWishlist, wishlist }: ProductsCatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>(LOCAL_PRODUCTS);
  const [loading, setLoading] = useState(false);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

  const isB2B = !!(user && (user.companyName || user.gstin || user.role === "B2B"));

  const searchFilter = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const materialFilter = searchParams.get("material") || "";
  const sortOption = searchParams.get("sort") || "featured";
  const inStockFilter = searchParams.get("inStock") === "true";

  const [localSearch, setLocalSearch] = useState(searchFilter);

  // 1. Fetch Dynamic Products from Backend API
  useEffect(() => {
    setLoading(true);
    fetchApi<{ products: Product[] }>("/products")
      .then((res) => {
        if (res.success && res.data && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        } else {
          setProducts(LOCAL_PRODUCTS);
        }
      })
      .catch(() => setProducts(LOCAL_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique categories & materials
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const materials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.material && set.add(p.material));
    return Array.from(set);
  }, [products]);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = p.category && p.category.toLowerCase().includes(query);
        const matchesMat = p.material && p.material.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesMat) return false;
      }
      if (categoryFilter && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (materialFilter && p.material?.toLowerCase() !== materialFilter.toLowerCase()) {
        return false;
      }
      if (inStockFilter && p.stock !== undefined && p.stock <= 0) {
        return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      const priceA = getEffectivePrice(a, user).unitPrice;
      const priceB = getEffectivePrice(b, user).unitPrice;
      if (sortOption === "low-to-high") return priceA - priceB;
      if (sortOption === "high-to-low") return priceB - priceA;
      if (sortOption === "rating") return (b.rating || 5) - (a.rating || 5);
      return 0; // featured default
    });
  }, [products, searchFilter, categoryFilter, materialFilter, inStockFilter, sortOption, user]);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const updateParam = (key: string, val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", localSearch);
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

      {/* ═══════════════ CINEMATIC HERO HEADER ═══════════════ */}
      <section className="relative bg-gradient-to-r from-[#34150F] via-[#5c2415] to-[#85431E] py-8 sm:py-12 md:py-14 px-4 sm:px-6 md:px-8 lg:px-16 text-[#EACEAA] overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D39858_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-3.5 py-1 rounded-full mb-3 shadow">
              <Sparkles size={14} className="text-[#D39858]" />
              <span className="text-[10px] font-black text-[#D39858] uppercase tracking-[0.2em]">
                Master Architectural Hardware Catalog
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-5xl font-black text-[#EACEAA] mb-2 tracking-tight"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Hardware Collections
            </h1>
            <p className="text-xs md:text-sm text-[#EACEAA]/75 max-w-xl leading-relaxed">
              Explore 200+ precision-engineered fittings, solid brass handles, silent soft-close hinges, and digital locks.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#EACEAA]/10 p-3 sm:p-4 rounded-tr-2xl rounded-bl-2xl border border-[#EACEAA]/15 backdrop-blur-xs flex-shrink-0">
            <div className="w-10 h-10 rounded-tr-lg rounded-bl-lg bg-[#D39858] text-[#34150F] flex items-center justify-center font-black text-lg shadow">
              {products.length}
            </div>
            <div>
              <p className="text-xs font-bold text-[#EACEAA]">Total Products Catalog</p>
              <p className="text-[10px] text-[#EACEAA]/60">Pan-India Express Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CATALOG CONTENT ═══════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-10">

        {/* ── Category Quick Filter Pills Bar ── */}
        <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto touch-pan-x pb-3 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => updateParam("category", "")}
            className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
              !categoryFilter
                ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
            }`}
          >
            All Hardware ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateParam("category", cat)}
              className={`shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Filter Controls Bar ── */}
        <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 border border-[rgba(52,21,15,0.08)] shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search handles, hinges, locks..."
                className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/50 pl-8 pr-7 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => { setLocalSearch(""); updateParam("search", ""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60 hover:text-[#34150F]"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold truncate"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-2 bg-[#EACEAA] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] cursor-pointer select-none font-bold text-[#34150F]">
              <input
                type="checkbox"
                checked={inStockFilter}
                onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
                className="accent-[#34150F] rounded"
              />
              <span>In Stock Only</span>
            </label>

            {/* Reset Filters */}
            {(searchFilter || categoryFilter || materialFilter || inStockFilter || sortOption !== "featured") && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  setSearchParams(new URLSearchParams());
                  setPage(1);
                }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-2"
              >
                <RefreshCw size={13} /> Reset All Filters
              </button>
            )}
          </div>
        </div>



        {/* ── Products Grid ── */}
        {loading ? (
          <ProductGridSkeleton count={16} />
        ) : displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-sm">
            <Package size={42} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No products found matching filters</h3>
            <p className="text-xs text-[#85431E] mb-4">Try adjusting your category selection or clear your search term.</p>
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                setSearchParams(new URLSearchParams());
              }}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
            {displayedProducts.map((product) => {
              const effective = getEffectivePrice(product, user);
              const isWishlisted =
                wishlist.has(product.id) ||
                wishlist.has(String(product.id)) ||
                ((product as any).apiId ? wishlist.has((product as any).apiId) : false);
              const isAdded = addedIds.has(product.id);
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
                    {/* Thumbnail + Overlay Controls */}
                    <div className="relative">
                      <ProductThumb src={product.image} name={product.name} />

                      {/* Discount Tag */}
                      {discountPercent > 0 && (
                        <span className="absolute top-3 left-3 bg-[#34150F] text-[#D39858] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-tr-lg rounded-bl-lg shadow-md border border-[#D39858]/30">
                          {discountPercent}% OFF
                        </span>
                      )}

                      {/* Quick View Button (Top-Right Eye Icon) */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                        className="absolute top-3 right-12 z-20 w-8 h-8 rounded-full bg-[#34150F]/80 text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F] flex items-center justify-center transition-all shadow-md active:scale-95"
                        title="Quick View"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => onWishlist(product)}
                        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full backdrop-blur-sm shadow flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
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

                      {/* Star Rating */}
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

                      {/* Pricing */}
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
                        {effective.isB2B && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            B2B Rate
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

        {/* ── Pagination Controls ── */}
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

      {/* ── Quick View Portal Modal ── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          wishlisted={wishlist.has(quickViewProduct.id)}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
        />
      )}
    </div>
  );
}
