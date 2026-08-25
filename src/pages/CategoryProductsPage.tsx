import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Filter, ArrowUpDown, ArrowLeft } from "lucide-react";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { getCategoryBySlugApi, ApiCategoryDetail } from "../services/categoryService";
import { getProductsByCategorySlugApi } from "../services/productService";
import { subscribeToProductSync } from "../services/productSyncService";
import { ProductCard } from "../components/product/ProductCard";
import { ProductGridSkeleton } from "../components/common/Skeletons";
import { getEffectivePrice } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";

interface CategoryProductsPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function CategoryProductsPage({ onAddToCart, onWishlist, wishlist }: CategoryProductsPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const b2bCache = useB2BPricing();

  const [categoryDetail, setCategoryDetail] = useState<ApiCategoryDetail | null>(null);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState("featured");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!slug) return;
      setLoading(true);

      try {
        const [catRes, prodRes] = await Promise.all([
          getCategoryBySlugApi(slug),
          getProductsByCategorySlugApi(slug),
        ]);

        if (isMounted) {
          if (catRes) {
            setCategoryDetail(catRes);
          }
          if (prodRes && prodRes.products) {
            setApiProducts(prodRes.products);
            if (prodRes.categoryName && !catRes) {
              setCategoryDetail((prev) => ({
                ...(prev || { id: slug, slug, name: prodRes.categoryName! }),
                name: prodRes.categoryName!,
                description: prodRes.description || prev?.description,
              }));
            }
          } else {
            setApiProducts([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch category products:", err);
        if (isMounted) setApiProducts([]);
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
  }, [slug]);

  const categoryName = useMemo(() => {
    if (categoryDetail?.name) return categoryDetail.name;
    if (!slug) return "Architectural Hardware";
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }, [categoryDetail, slug]);

  const filteredProducts = useMemo(() => {
    const list = [...apiProducts];

    return list.sort((a, b) => {
      const priceA = getEffectivePrice(a, user, 1, b2bCache).unitPrice;
      const priceB = getEffectivePrice(b, user, 1, b2bCache).unitPrice;
      if (sortOption === "low-to-high") return priceA - priceB;
      if (sortOption === "high-to-low") return priceB - priceA;
      if (sortOption === "discount") return (b.discount || 0) - (a.discount || 0);
      return String(a.id).localeCompare(String(b.id));
    });
  }, [apiProducts, sortOption, user, b2bCache]);

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-5 sm:py-8 px-3 sm:px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-7xl mx-auto">

        {/* Back Link */}
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs mb-6 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Categories</span>
        </Link>

        {/* Controls Bar */}
        <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-2.5 sm:p-4 shadow-xs border border-[rgba(52,21,15,0.08)] mb-3 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          <p className="text-[11px] sm:text-xs font-bold text-[#34150F]">
            Showing <strong className="text-[#D39858]">{filteredProducts.length}</strong> products in "{categoryName}"
          </p>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <ArrowUpDown size={13} className="text-[#D39858]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#EACEAA] text-[#34150F] text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.15)] outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-8 sm:p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-xs">
            <Filter size={32} className="text-[#D39858]/40 mx-auto mb-2.5" />
            <h3 className="text-sm sm:text-base font-black text-[#34150F] mb-1">No Specific Products Listed Yet</h3>
            <p className="text-xs text-[#85431E] mb-3.5">Explore all hardware lines in our full products catalog.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all active:scale-95"
            >
              View Full Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8">
            {filteredProducts.map((product) => {
              const isWishlisted =
                wishlist.has(product.id) ||
                wishlist.has(String(product.id)) ||
                (product.apiId ? wishlist.has(product.apiId) : false);

              return (
                <ProductCard
                  key={product.apiId || product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onWishlist={onWishlist}
                  wishlisted={isWishlisted}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
