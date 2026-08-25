import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "../product/ProductCard";
import { ProductSliderSkeleton } from "../common/Skeletons";
import { fetchApi } from "../../services/api";
import { subscribeToProductSync } from "../../services/productSyncService";
import { normalizeRawProduct } from "../../utils/productUtils";

import { DEFAULT_SHOWCASE_PRODUCTS } from "../../data/products";

interface BestSellerSectionProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
  onViewAll?: (cat: string) => void;
}

export function BestSellerSection({ onAddToCart, onWishlist, wishlist }: BestSellerSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bestSellers, setBestSellers] = useState<Product[]>(DEFAULT_SHOWCASE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const loadBestSellers = () => {
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
            const marked = normalized.filter((p) => p.isBestseller === true || (Array.isArray(p.tags) && p.tags.includes("bestseller")));
            setBestSellers(marked.length > 0 ? marked : normalized.slice(0, 8));
          } else {
            setBestSellers(DEFAULT_SHOWCASE_PRODUCTS);
          }
        } else {
          setBestSellers(DEFAULT_SHOWCASE_PRODUCTS);
        }
      })
      .catch(() => {
        setBestSellers(DEFAULT_SHOWCASE_PRODUCTS);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBestSellers();
    return subscribeToProductSync(loadBestSellers);
  }, []);

  if (loading) {
    return <ProductSliderSkeleton title="Best Sellers" />;
  }

  // Native GPU-accelerated smooth 1-card scroll
  const scroll = (direction: number) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector<HTMLElement>(":scope > div");
      const cardWidth = card ? card.offsetWidth + 20 : 300;
      scrollRef.current.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
    }
  };

  return (
    <section className="py-6 sm:py-12 px-3 sm:px-4 md:px-8 lg:px-16">
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
        <div>
          <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Best Sellers
          </h2>
        </div>

        {/* Clicking View All navigates directly to /bestsellers */}
        <Link
          to="/bestsellers"
          className="group relative inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-2.5 py-1 sm:px-4 sm:py-2 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
        >
          <span className="inline sm:hidden">All</span>
          <span className="hidden sm:inline">View All Best Sellers</span>
          <ArrowRight size={13} className="sm:w-4 sm:h-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Link>
      </div>

      <div className="relative group/section">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous Best Seller"
          className="hidden lg:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Native GPU-Accelerated Smooth Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-2 sm:py-4 px-0.5 sm:px-1"
        >
          {bestSellers.map((p) => {
            const isHovered = hoveredId === p.id;
            const isOtherHovered = hoveredId !== null && !isHovered;

            return (
              <div
                key={p.apiId || p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex-shrink-0 w-[145px] xs:w-[160px] sm:w-[260px] md:w-[300px] lg:w-[calc(25%-15px)] transition-all duration-300 ease-out ${
                  isHovered
                    ? "scale-105 z-20 opacity-100"
                    : isOtherHovered
                    ? "scale-95 opacity-40"
                    : "scale-100 opacity-100"
                }`}
              >
                <ProductCard
                  product={p}
                  onAddToCart={onAddToCart}
                  onWishlist={onWishlist}
                  wishlisted={
                    wishlist.has(p.id) ||
                    wishlist.has(String(p.id)) ||
                    ((p as any).apiId ? wishlist.has((p as any).apiId) : false)
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next Best Seller"
          className="hidden lg:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
