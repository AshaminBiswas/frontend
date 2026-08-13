import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Filter, ArrowUpDown, ArrowLeft } from "lucide-react";
import { Product } from "../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS, CUBICLE_HARDWARE_PRODUCTS, LOCKER_HARDWARE_PRODUCTS } from "../data/products";
import { useAuth } from "../context/AuthContext";
import { getCategoryBySlugApi, ApiCategoryDetail } from "../services/categoryService";
import { getProductsByCategorySlugApi } from "../services/productService";
import { ProductCard } from "../components/product/ProductCard";
import { ProductGridSkeleton } from "../components/common/Skeletons";

const ALL_PRODUCTS: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
  ...CUBICLE_HARDWARE_PRODUCTS,
  ...LOCKER_HARDWARE_PRODUCTS,
];

// In-memory cache for category metadata to prevent re-loading flicker on category switches
const categoryCacheMap = new Map<string, ApiCategoryDetail>();
const productsCacheMap = new Map<string, Product[]>();

interface CategoryProductsPageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
}

export function CategoryProductsPage({ onAddToCart, onWishlist, wishlist }: CategoryProductsPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoryDetail, setCategoryDetail] = useState<ApiCategoryDetail | null>(() => {
    return slug && categoryCacheMap.has(slug) ? categoryCacheMap.get(slug)! : null;
  });
  const [apiProducts, setApiProducts] = useState<Product[]>(() => {
    return slug && productsCacheMap.has(slug) ? productsCacheMap.get(slug)! : [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !(slug && categoryCacheMap.has(slug) && productsCacheMap.has(slug));
  });
  const [sortOption, setSortOption] = useState("featured");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!slug) return;

      if (categoryCacheMap.has(slug)) {
        setCategoryDetail(categoryCacheMap.get(slug)!);
      }
      if (productsCacheMap.has(slug)) {
        setApiProducts(productsCacheMap.get(slug)!);
      }

      if (!categoryCacheMap.has(slug) || !productsCacheMap.has(slug)) {
        setLoading(true);
      }

      try {
        const [catRes, prodRes] = await Promise.all([
          getCategoryBySlugApi(slug),
          getProductsByCategorySlugApi(slug),
        ]);

        if (isMounted) {
          if (catRes) {
            setCategoryDetail(catRes);
            categoryCacheMap.set(slug, catRes);
          }
          if (prodRes && prodRes.products && prodRes.products.length > 0) {
            setApiProducts(prodRes.products);
            productsCacheMap.set(slug, prodRes.products);
            if (prodRes.categoryName && !catRes) {
              setCategoryDetail((prev) => ({
                ...(prev || { id: slug, slug, name: prodRes.categoryName! }),
                name: prodRes.categoryName!,
                description: prodRes.description || prev?.description
              }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch category products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
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
    let baseList = apiProducts.length > 0
      ? apiProducts.filter((p) => {
          if (!slug) return true;
          const catStr = (p.category || "").toLowerCase();
          const targetSlug = slug.toLowerCase().replace(/-/g, ' ');
          if (targetSlug.includes("cubicle")) return catStr.includes("cubicle");
          if (targetSlug.includes("locker")) return catStr.includes("locker");
          return catStr.includes(targetSlug) || targetSlug.includes(catStr);
        })
      : ALL_PRODUCTS.filter((p) => {
          const catStr = (p.category || "").toLowerCase();
          const targetSlug = (slug || "").toLowerCase().replace(/-/g, ' ');
          const targetName = categoryName.toLowerCase();
          if (targetSlug.includes("cubicle") || targetName.includes("cubicle")) {
            return catStr.includes("cubicle");
          }
          if (targetSlug.includes("locker") || targetName.includes("locker")) {
            return catStr.includes("locker");
          }
          return (
            catStr.includes(targetSlug) ||
            catStr.includes(targetName) ||
            targetSlug.includes(catStr)
          );
        });

    return [...baseList].sort((a, b) => {
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      if (sortOption === "low-to-high") return priceA - priceB;
      if (sortOption === "high-to-low") return priceB - priceA;
      if (sortOption === "discount") return (b.discount || 0) - (a.discount || 0);
      return a.id - b.id;
    });
  }, [apiProducts, categoryName, slug, sortOption]);

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
        <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 shadow-sm border border-[#34150F]/8 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-[#34150F]">
            Showing <strong className="text-[#D39858]">{filteredProducts.length}</strong> products for "{categoryName}"
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={15} className="text-[#D39858]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#f5e8d4] text-[#34150F] text-xs font-bold px-3 py-2 rounded-tr-xl rounded-bl-xl border border-[#34150F]/15 outline-none cursor-pointer w-full sm:w-auto"
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
          <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-12 text-center border border-[#34150F]/8 shadow-sm">
            <Filter size={36} className="text-[#D39858]/40 mx-auto mb-3" />
            <h3 className="text-base font-black text-[#34150F] mb-1">No Specific Products Listed Yet</h3>
            <p className="text-xs text-[#85431E] mb-4">Explore all hardware lines in our full products catalog.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
            >
              View Full Products Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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
