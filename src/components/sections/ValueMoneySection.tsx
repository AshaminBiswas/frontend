import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "../product/ProductCard";
import { fetchApi } from "../../services/api";
import { subscribeToProductSync } from "../../services/productSyncService";
import { normalizeRawProduct } from "../../utils/productUtils";
import { useInView } from "../../hooks/useInView";

interface ValueMoneySectionProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
  onViewAll?: (cat: string) => void;
}

export function ValueMoneySection({ onAddToCart, onWishlist, wishlist }: ValueMoneySectionProps) {
  const { ref: sectionRef, visible } = useInView({ threshold: 0.1 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [valueProducts, setValueProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const loadProducts = () => {
    // Strictly fetch only products flagged as isFeatured=true (Value for Money)
    fetchApi<any>("/products?isFeatured=true&limit=20&status=ACTIVE")
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
            setValueProducts(rawList.map(normalizeRawProduct));
          } else {
            setValueProducts([]);
          }
        } else {
          setValueProducts([]);
        }
      })
      .catch(() => {
        setValueProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
    return subscribeToProductSync(loadProducts);
  }, []);

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector<HTMLElement>(":scope > div");
      const cardWidth = card ? card.offsetWidth + 20 : 300;
      scrollRef.current.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
    }
  };

  // Hide section entirely when loading is done and no products are assigned
  if (!loading && valueProducts.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`py-6 sm:py-12 px-3 sm:px-4 md:px-8 lg:px-16 overflow-hidden will-change-transform transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 sm:translate-y-16"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 mb-4 sm:mb-8 transition-all duration-600 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div>
          <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Value for Money
          </h2>
        </div>

        <Link
          to="/products"
          className="group relative inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-2.5 py-1 sm:px-4 sm:py-2 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
        >
          <span className="inline sm:hidden">All</span>
          <span className="hidden sm:inline">View All</span>
          <ArrowRight size={13} className="sm:w-4 sm:h-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Link>
      </div>

      <div
        className={`relative group/section transition-all duration-700 delay-100 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous Collection"
          className="hidden lg:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-2 sm:py-4 px-0.5 sm:px-1"
        >
          {valueProducts.map((p, idx) => {
            const isHovered = hoveredId === p.id;
            const isOtherHovered = hoveredId !== null && !isHovered;

            return (
              <div
                key={p.apiId || p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ transitionDelay: visible ? `${idx * 45}ms` : "0ms" }}
                className={`flex-shrink-0 w-[145px] xs:w-[160px] sm:w-[260px] md:w-[300px] lg:w-[calc(25%-15px)] transition-all duration-500 ease-out ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                } ${
                  isHovered ? "scale-105 z-20 opacity-100" : isOtherHovered ? "scale-95 opacity-40" : "scale-100"
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

        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next Collection"
          className="hidden lg:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
