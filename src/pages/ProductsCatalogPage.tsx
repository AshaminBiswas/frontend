import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search, Filter, SlidersHorizontal, ShoppingCart, Heart, ArrowUpDown,
  Building2, Eye, Sparkles, Check, Package, X, RefreshCw, ChevronLeft,
  ChevronRight, Star, Flame, ShieldCheck, Truck, Layers
} from "lucide-react";
import { Product } from "../types";
import { QuickViewModal } from "../components/product/QuickViewModal";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";
import { subscribeToProductSync } from "../services/productSyncService";
import { ProductCard } from "../components/product/ProductCard";
import { fetchApi } from "../services/api";
import { isProductOfMaterial } from "../utils/materials";

function safeCategoryString(category: any): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object") {
    return category.name || category.slug || category.title || "";
  }
  return String(category);
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

interface ProductsCatalogPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function ProductsCatalogPage({ onAddToCart, onWishlist, wishlist }: ProductsCatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const b2bCache = useB2BPricing();

  const loadCatalog = () => {
    fetchApi<any>("/products?limit=100")
      .then((res) => {
        if (res && res.success && res.data) {
          const rawList = Array.isArray(res.data.products)
            ? res.data.products
            : (Array.isArray(res.data) ? res.data : (Array.isArray(res.data.items) ? res.data.items : []));

          if (rawList.length > 0) {
            const normalized = rawList.map((p: any) => ({
              ...p,
              id: p.id || p._id || `PRD-${Date.now()}`,
              apiId: String(p.id || p._id || p.apiId || ""),
              category: safeCategoryString(p.category),
              price: Number(p.salePrice || p.offerPrice || p.price || 0),
              salePrice: Number(p.salePrice || p.offerPrice || p.price || 0),
              regularPrice: Number(p.regularPrice || p.originalPrice || p.price || 0),
              originalPrice: Number(p.regularPrice || p.originalPrice || p.price || 0),
              image: p.thumbnail || (Array.isArray(p.images) && p.images[0]) || p.image || "",
              b2bPrice: p.b2bPrice !== undefined ? Number(p.b2bPrice) : (p.b2b_price !== undefined ? Number(p.b2b_price) : undefined),
            }));
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
    loadCatalog();
    return subscribeToProductSync(loadCatalog);
  }, []);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number | string>>(new Set());

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

  const isB2B = !!(user && (user.companyName || user.gstin || user.role === "B2B"));

  const searchFilter = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const materialFilter = searchParams.get("material") || "";
  const sortOption = searchParams.get("sort") || "featured";
  const inStockFilter = searchParams.get("inStock") === "true";

  const [localSearch, setLocalSearch] = useState(searchFilter);

  // Extract unique categories & materials
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = safeCategoryString(p.category);
      if (cat) set.add(cat);
    });
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
      const catStr = safeCategoryString(p.category).toLowerCase();
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesName = (p.name || "").toLowerCase().includes(query);
        const matchesCat = catStr.includes(query);
        const matchesMat = typeof p.material === "string" && p.material.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesMat) return false;
      }
      if (categoryFilter) {
        const targetFilter = categoryFilter.toLowerCase();
        if (targetFilter.includes("cubicle")) {
          if (!catStr.includes("cubicle")) return false;
        } else if (targetFilter.includes("locker")) {
          if (!catStr.includes("locker")) return false;
        } else if (catStr !== targetFilter && !catStr.includes(targetFilter) && !targetFilter.includes(catStr)) {
          return false;
        }
      }
      if (materialFilter && !isProductOfMaterial(p, materialFilter)) {
        return false;
      }
      if (inStockFilter && (p.inStock === false || (typeof p.stock === "number" && p.stock <= 0))) {
        return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      const priceA = getEffectivePrice(a, user, 1, b2bCache).unitPrice;
      const priceB = getEffectivePrice(b, user, 1, b2bCache).unitPrice;
      if (sortOption === "low-to-high") return priceA - priceB;
      if (sortOption === "high-to-low") return priceB - priceA;
      if (sortOption === "rating") return (b.rating || 5) - (a.rating || 5);
      return 0; // featured default
    });
  }, [products, searchFilter, categoryFilter, materialFilter, inStockFilter, sortOption, user, b2bCache]);

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
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-[#34150F] py-5 sm:py-8 md:py-12 px-3 sm:px-6 md:px-8 lg:px-16 border-b border-[#EACEAA]/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-[#D39858]/5 pointer-events-none rounded-bl-full" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#EACEAA]/15 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold text-[#D39858] mb-2 uppercase tracking-wider">
              <Sparkles size={11} /> 100% Guaranteed 304/316 Architectural Grade
            </div>
            <h1
              className="text-xl sm:text-2xl md:text-4xl font-black text-[#EACEAA] mb-1 sm:mb-2 tracking-tight"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Hardware Collections
            </h1>
            <p className="text-xs sm:text-sm text-[#EACEAA]/75 max-w-xl leading-relaxed">
              Explore 200+ precision-engineered fittings, solid brass handles, silent soft-close hinges, and digital locks.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-[#EACEAA]/10 p-2.5 sm:p-3.5 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/15 backdrop-blur-xs flex-shrink-0 self-start md:self-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-tr-lg rounded-bl-lg bg-[#D39858] text-[#34150F] flex items-center justify-center font-black text-base sm:text-lg shadow">
              {products.length}
            </div>
            <div>
              <p className="text-xs font-bold text-[#EACEAA]">Total Products</p>
              <p className="text-[10px] text-[#EACEAA]/60">Pan-India Express Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CATALOG CONTENT ═══════════════ */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-8">

        {/* ── Category Quick Filter Pills Bar ── */}
        <div className="w-full max-w-full flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x pb-2 mb-3 sm:mb-5 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => updateParam("category", "")}
            className={`shrink-0 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border ${
              !categoryFilter
                ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-xs"
                : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateParam("category", cat)}
              className={`shrink-0 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-xs"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Filter Controls Bar ── */}
        <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-2.5 sm:p-4 border border-[rgba(52,21,15,0.08)] shadow-xs mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search handles, hinges, locks..."
                className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/50 pl-7 pr-7 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => { setLocalSearch(""); updateParam("search", ""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60 hover:text-[#34150F]"
                >
                  <X size={12} />
                </button>
              )}
            </form>

            {/* Material Filter Dropdown */}
            <select
              value={materialFilter}
              onChange={(e) => updateParam("material", e.target.value)}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold truncate"
            >
              <option value="">All Raw Materials</option>
              <option value="304 Grade Steel">304 Grade Steel (SS 304)</option>
              <option value="316 Grade Steel">316 Grade Steel (Marine)</option>
              <option value="Aluminium">Aluminium Extrusions</option>
              <option value="Brass & Zinc Fittings">Brass & Zinc Fittings</option>
              <option value="Nylon Polyamide 6">Nylon Polyamide 6</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="w-full max-w-full bg-[#EACEAA] text-[#34150F] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold truncate"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-2 bg-[#EACEAA] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[11px] sm:text-xs border border-[rgba(52,21,15,0.15)] cursor-pointer select-none font-bold text-[#34150F]">
              <input
                type="checkbox"
                checked={inStockFilter}
                onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
                className="accent-[#34150F] rounded"
              />
              <span>In Stock Only</span>
            </label>

            {/* Reset Filters */}
            {(searchFilter || categoryFilter || materialFilter || inStockFilter || sortOption !== "featured") ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  setSearchParams(new URLSearchParams());
                  setPage(1);
                }}
                className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-1.5 sm:py-2 bg-[#EACEAA]/50 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.15)]"
              >
                <RefreshCw size={12} /> Reset Filters
              </button>
            ) : (
              <div className="hidden lg:flex items-center justify-center text-[11px] font-bold text-[#85431E]/60">
                <span>Showing {filteredProducts.length} Items</span>
              </div>
            )}
          </div>

          {/* Active Material Filter Badge */}
          {materialFilter && (
            <div className="mt-2.5 pt-2 border-t border-[rgba(52,21,15,0.08)] flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-[#85431E]">Active Material:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34150F] text-[#EACEAA] text-[10px] font-extrabold shadow-xs">
                <span>{materialFilter}</span>
                <button
                  type="button"
                  onClick={() => updateParam("material", "")}
                  className="hover:text-[#D39858] transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
              <span className="text-[10px] text-[#85431E]/70 font-semibold">
                ({filteredProducts.length} found)
              </span>
            </div>
          )}
        </div>

        {/* ── Products Grid or Status ── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#85431E]">Loading products catalog...</span>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-8 sm:p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-xs">
            <Package size={36} className="text-[#85431E]/40 mx-auto mb-2.5" />
            <h3 className="text-sm sm:text-base font-bold text-[#34150F] mb-1">No products found matching filters</h3>
            <p className="text-xs text-[#85431E] mb-3.5">Try adjusting your category selection or clear your search term.</p>
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                setSearchParams(new URLSearchParams());
              }}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8 sm:mb-10">
            {displayedProducts.map((product) => (
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
