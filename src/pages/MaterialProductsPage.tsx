import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Shield,
  Anchor,
  Layers,
  Box,
  ArrowLeft,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Package,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { getAllProductsApi } from "../services/productService";
import { getLiveCatalog, subscribeToProductSync } from "../services/productSyncService";
import { ProductCard } from "../components/product/ProductCard";
import { ProductGridSkeleton } from "../components/common/Skeletons";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";
import {
  MATERIAL_REGISTRY,
  isProductOfMaterial,
  resolveMaterialBySlug,
  type MaterialMeta,
} from "../utils/materials";

export { MATERIAL_REGISTRY, isProductOfMaterial, resolveMaterialBySlug };
export type { MaterialMeta };

interface MaterialProductsPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function MaterialProductsPage({ onAddToCart, onWishlist, wishlist }: MaterialProductsPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const b2bCache = useB2BPricing();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<string>("featured");


  const currentMaterial = useMemo(() => {
    return resolveMaterialBySlug(slug);
  }, [slug]);

  // Load products on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const live = await getAllProductsApi(100);
        if (isMounted && live && live.length > 0) {
          setProducts(getLiveCatalog(live));
        }
      } catch (err) {
        console.error("Failed to load material products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    const unsubscribe = subscribeToProductSync(() => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Material item counts map
  const materialCounts = useMemo(() => {
    const map: Record<string, number> = {};
    MATERIAL_REGISTRY.forEach((m) => {
      map[m.slug] = products.filter((p) => isProductOfMaterial(p, m.slug)).length;
    });
    return map;
  }, [products]);

  // Filter products by current material ONLY
  const materialProducts = useMemo(() => {
    const list = products.filter((p) => isProductOfMaterial(p, currentMaterial.slug));

    return list.sort((a, b) => {
      const priceA = getEffectivePrice(a, user, 1, b2bCache).unitPrice;
      const priceB = getEffectivePrice(b, user, 1, b2bCache).unitPrice;
      if (sortOption === "low-to-high") return priceA - priceB;
      if (sortOption === "high-to-low") return priceB - priceA;
      if (sortOption === "discount") return (b.discount || 0) - (a.discount || 0);
      if (sortOption === "rating") return (b.rating || 5) - (a.rating || 5);
      return String(a.id).localeCompare(String(b.id));
    });
  }, [products, currentMaterial, sortOption, user, b2bCache]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Shield": return <Shield size={24} className="text-[#34150F]" />;
      case "Anchor": return <Anchor size={24} className="text-[#34150F]" />;
      case "Layers": return <Layers size={24} className="text-[#34150F]" />;
      case "Box": return <Box size={24} className="text-[#34150F]" />;
      default: return <Package size={24} className="text-[#34150F]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ─── Hero Section ─── */}
      <section className="bg-[#34150F] text-[#FAFAFA] border-b border-[#EACEAA]/15 pt-8 pb-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#EACEAA]/70 mb-4 flex-wrap">
            <Link to="/" className="hover:text-[#D39858] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#EACEAA]/50">By Materials</span>
            <span>/</span>
            <span className="text-[#D39858] font-bold">{currentMaterial.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-tr-2xl rounded-bl-2xl bg-[#D39858] flex items-center justify-center shadow-lg flex-shrink-0">
                  {renderIcon(currentMaterial.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#D39858]/20 border border-[#D39858]/40 text-[#D39858] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {currentMaterial.gradeBadge}
                    </span>
                    <span className="text-xs text-[#EACEAA]/60 font-mono">
                      {materialProducts.length} Certified Products
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#EACEAA] tracking-tight mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                    {currentMaterial.name}
                  </h1>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#EACEAA]/80 leading-relaxed">
                {currentMaterial.description}
              </p>

              {/* Spec Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {currentMaterial.specs.map((spec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#EACEAA] bg-[#1e0a06]/80 px-2.5 py-1 rounded-lg border border-[#EACEAA]/15"
                  >
                    <CheckCircle2 size={11} className="text-[#D39858]" />
                    <span>{spec}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-1.5 self-start md:self-center bg-[#EACEAA]/15 hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] text-xs font-bold px-4 py-2.5 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/25 transition-all shadow"
            >
              <ArrowLeft size={14} />
              <span>Full Catalog</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        
        {/* ── Quick Material Switcher Tabs Bar ── */}
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {MATERIAL_REGISTRY.map((mat) => {
            const isActive = mat.slug === currentMaterial.slug;
            const count = materialCounts[mat.slug] || 0;

            return (
              <button
                key={mat.slug}
                type="button"
                onClick={() => navigate(`/material/${mat.slug}`)}
                className={`shrink-0 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${
                  isActive
                    ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-md"
                    : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
                }`}
              >
                <span>{mat.name}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? "bg-[#D39858] text-[#34150F]" : "bg-[#34150F]/10 text-[#85431E]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filter & Sort Bar ── */}
        <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 border border-[rgba(52,21,15,0.08)] shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#85431E]">
            <Filter size={15} className="text-[#34150F]" />
            <span>Showing strictly <strong className="text-[#34150F]">{currentMaterial.name}</strong> items ({materialProducts.length})</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-bold text-[#85431E]">Sort By:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] font-bold"
            >
              <option value="featured">Featured First</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* ── Products Grid ── */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : materialProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#f5e8d4] rounded-2xl sm:rounded-3xl border border-[rgba(52,21,15,0.1)] p-6 sm:p-8">
            <Package size={36} className="mx-auto mb-2.5 text-[#D39858]" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#34150F]">No products found for {currentMaterial.name}</h3>
            <p className="text-xs text-[#85431E] mt-1 max-w-sm mx-auto">
              Our inventory for this specific material is currently updating. Please browse our other certified materials.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => navigate("/products")}
                className="px-4 py-2 bg-[#34150F] text-[#EACEAA] text-xs font-bold rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all active:scale-95"
              >
                Browse All Catalog
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8">
            {materialProducts.map((product) => (
              <ProductCard
                key={product.id || (product as any).apiId || product.name}
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

      </div>
    </div>
  );
}
