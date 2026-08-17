import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Grid, ChevronRight, Package, Sparkles, Layers, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { getCategoriesApi, ApiCategory } from "../services/categoryService";
import { fetchApi } from "../services/api";
import { subscribeToProductSync } from "../services/productSyncService";
import { ProductCard } from "../components/product/ProductCard";
import { CategoriesCatalogSkeleton } from "../components/common/Skeletons";

function safeCategoryString(category: any): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object") {
    return category.name || category.slug || category.title || "";
  }
  return String(category);
}

function normalizeRawProduct(item: any): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const finalId = item.id !== undefined && item.id !== null ? item.id : (rawId || apiIdStr || "1");

  const catStr = safeCategoryString(item.category);
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

  return {
    ...item,
    id: finalId,
    apiId: apiIdStr,
    name: item.name || item.title || "Architectural Hardware",
    category: catStr,
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

interface CategoriesPageProps {
  onAddToCart?: (p: Product) => void;
  onWishlist?: (p: Product | number | string) => void;
  wishlist?: Set<number | string>;
}

export function CategoriesPage({
  onAddToCart = () => {},
  onWishlist = () => {},
  wishlist = new Set(),
}: CategoriesPageProps) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, prodRes] = await Promise.allSettled([
        getCategoriesApi(1, 50),
        fetchApi<any>("/products?limit=200"),
      ]);

      if (catData.status === "fulfilled" && Array.isArray(catData.value) && catData.value.length > 0) {
        setCategories(catData.value);
      }

      if (prodRes.status === "fulfilled" && prodRes.value && prodRes.value.success && prodRes.value.data) {
        let rawList: any[] = [];
        if (Array.isArray(prodRes.value.data.products)) {
          rawList = prodRes.value.data.products;
        } else if (Array.isArray(prodRes.value.data)) {
          rawList = prodRes.value.data;
        } else if (Array.isArray(prodRes.value.data.items)) {
          rawList = prodRes.value.data.items;
        }

        if (rawList.length > 0) {
          const normalized = rawList.map(normalizeRawProduct);
          setProducts(normalized);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToProductSync(loadData);
  }, []);

  // Dynamic Category Cards Display List
  const displayCategoryList = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((cat) => {
        const catProductsCount = products.filter((p) => {
          const pCat = safeCategoryString(p.category).toLowerCase();
          const cName = (cat.name || "").toLowerCase();
          const cSlug = (cat.slug || "").toLowerCase().replace(/-/g, " ");
          return pCat.includes(cName) || cName.includes(pCat) || (cSlug && pCat.includes(cSlug));
        }).length;

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          status: cat.status || "ACTIVE",
          productCount: cat.productCount !== undefined && cat.productCount > 0 ? cat.productCount : catProductsCount,
          image: cat.image,
        };
      });
    }

    return CATEGORY_OPTIONS.map((cat, idx) => {
      const catCount = products.filter((p) => {
        const pCat = safeCategoryString(p.category).toLowerCase();
        return pCat === (cat.label || "").toLowerCase();
      }).length;

      return {
        id: String(idx + 1),
        name: cat.label,
        slug: cat.label.toLowerCase().replace(/\s+/g, "-"),
        status: "ACTIVE",
        productCount: catCount,
        image: null,
      };
    });
  }, [categories, products]);

  // Dynamic Specialized Product Lines derived from live product attributes, tags, and categories
  const dynamicProductLines = useMemo(() => {
    const linesMap = new Map<string, { label: string; count: number; searchVal: string; categorySlug?: string }>();

    // A. Add active dynamic categories as primary lines
    displayCategoryList.forEach((cat) => {
      if (cat.status === "ACTIVE") {
        linesMap.set(cat.name.toLowerCase(), {
          label: cat.name,
          count: cat.productCount || 0,
          searchVal: cat.name,
          categorySlug: cat.slug,
        });
      }
    });

    // B. Extract dynamic subcategories/tags/lines from loaded products
    products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag: string) => {
          if (tag && typeof tag === "string" && tag.trim()) {
            const key = tag.trim().toLowerCase();
            const existing = linesMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              linesMap.set(key, {
                label: tag.trim(),
                count: 1,
                searchVal: tag.trim(),
              });
            }
          }
        });
      }

      if (Array.isArray(p.compatibleFor)) {
        p.compatibleFor.forEach((item: string) => {
          if (item && typeof item === "string" && item.trim()) {
            const formatted = item.charAt(0).toUpperCase() + item.slice(1) + " Systems";
            const key = formatted.toLowerCase();
            const existing = linesMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              linesMap.set(key, {
                label: formatted,
                count: 1,
                searchVal: item.trim(),
              });
            }
          }
        });
      }

      if (p.material && typeof p.material === "string" && p.material.trim() && p.material.length < 30) {
        const matKey = p.material.trim().toLowerCase();
        if (!linesMap.has(matKey)) {
          linesMap.set(matKey, {
            label: p.material.trim(),
            count: 1,
            searchVal: p.material.trim(),
          });
        }
      }
    });

    return Array.from(linesMap.values());
  }, [displayCategoryList, products]);

  // Products filtered by selected dynamic product line
  const filteredProducts = useMemo(() => {
    if (selectedLine === "ALL") return products;

    const term = selectedLine.toLowerCase();
    return products.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(term);
      const catMatch = safeCategoryString(p.category).toLowerCase().includes(term);
      const matMatch = typeof p.material === "string" && p.material.toLowerCase().includes(term);
      const tagMatch = Array.isArray(p.tags) && p.tags.some((t: string) => typeof t === "string" && t.toLowerCase().includes(term));
      const compMatch = Array.isArray(p.compatibleFor) && p.compatibleFor.some((c: string) => typeof c === "string" && c.toLowerCase().includes(term));
      return nameMatch || catMatch || matMatch || tagMatch || compMatch;
    });
  }, [products, selectedLine]);

  // If initial load is in progress, display unified skeleton loader (no stale UI flashing)
  if (loading) {
    return <CategoriesCatalogSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-6 sm:py-10 px-3 sm:px-6 md:px-8 lg:px-16 animate-in fade-in duration-300" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ── Page Header ── */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D39858]/15 border border-[#D39858]/30 text-[#85431E] text-xs font-bold mb-2">
            <Sparkles size={13} className="text-[#D39858]" />
            <span>Architecture & Fitting Solutions</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#34150F] tracking-tight" style={{ fontFamily: "'Gilda Display', serif" }}>
            Hardware Categories Catalog
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#85431E] mt-1 max-w-2xl">
            Explore commercial-grade architectural fittings engineered for cubicles, lockers, washrooms, and luxury commercial interiors.
          </p>
        </div>

        {/* ── Section 1: Main Category Hub Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-black text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
              <Layers size={18} className="text-[#D39858]" /> Primary Hardware Categories
            </h2>
            <Link
              to="/products"
              className="text-xs font-bold text-[#85431E] hover:text-[#34150F] inline-flex items-center gap-1 transition-colors"
            >
              Browse Full Catalog <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCategoryList.map((cat, idx) => (
              <Link
                key={cat.id || cat.name}
                to={`/category/${cat.slug}`}
                className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/8 hover:shadow-lg hover:border-[#D39858] transition-all group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-tr-xl rounded-bl-xl bg-[#EACEAA]/40 text-[#D39858] flex items-center justify-center font-black text-sm group-hover:bg-[#34150F] group-hover:text-[#EACEAA] transition-colors">
                      0{idx + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      {cat.productCount !== undefined && cat.productCount > 0 && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EACEAA]/40 text-[#85431E] border border-[#34150F]/5">
                          {cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}
                        </span>
                      )}
                      {cat.status === "INACTIVE" && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-black text-[#34150F] group-hover:text-[#D39858] transition-colors mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#85431E]/80 line-clamp-2 mb-4 leading-relaxed">
                    Commercial-grade architectural fittings and hardware engineered for durability and heavy daily utilization.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D39858] group-hover:translate-x-1.5 transition-transform mt-auto pt-2 border-t border-[#34150F]/5">
                  Explore Category <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Section 2: Specialised Product Lines (100% Dynamic) ── */}
        <div className="bg-white rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 shadow-sm border border-[#34150F]/8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                <Grid size={20} className="text-[#D39858]" /> Specialised Product Lines
              </h2>
              <p className="text-xs font-semibold text-[#85431E] mt-0.5">
                Dynamic series, component lines, and hardware groupings loaded directly from live catalog data.
              </p>
            </div>
            <div className="text-xs font-bold text-[#85431E] bg-[#EACEAA]/30 px-3 py-1.5 rounded-tr-lg rounded-bl-lg border border-[#34150F]/8 self-start sm:self-auto">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Product Listed" : "Products Listed"}
            </div>
          </div>

          {/* Dynamic Product Line Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedLine("ALL")}
              className={`px-3.5 py-1.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedLine === "ALL"
                  ? "bg-[#34150F] text-[#EACEAA] shadow-sm shadow-[#34150F]/20"
                  : "bg-[#EACEAA]/30 text-[#34150F] hover:bg-[#EACEAA]/60 border border-[#34150F]/8"
              }`}
            >
              <span>All Product Lines</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedLine === "ALL" ? "bg-[#D39858] text-[#34150F]" : "bg-[#34150F]/10 text-[#85431E]"
              }`}>
                {products.length}
              </span>
            </button>

            {dynamicProductLines.map((line) => {
              const isSelected = selectedLine.toLowerCase() === line.searchVal.toLowerCase();
              return (
                <button
                  key={line.label}
                  type="button"
                  onClick={() => setSelectedLine(isSelected ? "ALL" : line.searchVal)}
                  className={`px-3.5 py-1.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#34150F] text-[#EACEAA] shadow-sm shadow-[#34150F]/20"
                      : "bg-[#EACEAA]/30 text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] border border-[#34150F]/8"
                  }`}
                >
                  <span>{line.label}</span>
                  {line.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-[#D39858] text-[#34150F]" : "bg-[#34150F]/10 text-[#85431E] group-hover:bg-[#EACEAA]/20 group-hover:text-[#EACEAA]"
                    }`}>
                      {line.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Products Grid for the Active Product Line */}
          <div className="pt-2">
            {filteredProducts.length === 0 ? (
              <div className="bg-[#FAF4ED] rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/8">
                <Package size={36} className="text-[#85431E]/40 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#34150F]">No products found for this line</h3>
                <p className="text-xs text-[#85431E] mt-1 mb-3">Try choosing another product line or check back soon.</p>
                <button
                  type="button"
                  onClick={() => setSelectedLine("ALL")}
                  className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2 rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-colors"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id || prod.apiId || prod.name}
                    product={prod}
                    onAddToCart={onAddToCart}
                    onWishlist={onWishlist}
                    wishlisted={wishlist.has(prod.id) || (prod.apiId ? wishlist.has(prod.apiId) : false)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
