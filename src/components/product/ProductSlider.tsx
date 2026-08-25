import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "../common/Reveal";

interface ProductSliderProps {
  products: Product[];
  title: string;
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
  onViewAll?: (title: string) => void;
}

export function ProductSlider({ products, title, onAddToCart, onWishlist, wishlist, onViewAll }: ProductSliderProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const prevPage = () => setPage((p) => (p > 0 ? p - 1 : totalPages - 1));
  const nextPage = () => setPage((p) => (p < totalPages - 1 ? p + 1 : 0));

  // On desktop, slice 4 items for paginated view; on mobile, show all products in a horizontal scroll strip
  const visibleDesktopProducts = products.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <section className="py-4 sm:py-6 md:py-10 px-3 sm:px-6 md:px-8 lg:px-16">
      <Reveal>
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onViewAll && onViewAll(title)}
            className="group relative inline-flex items-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-xs active:scale-95"
          >
            <span>View All</span>
            <ArrowRight size={13} className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </button>
        </div>
      </Reveal>

      {/* ── Mobile View: Smooth Horizontal Swipe Strip ── */}
      <div className="md:hidden flex overflow-x-auto gap-2.5 pb-2 no-scrollbar snap-x snap-mandatory -mx-3 px-3">
        {products.slice(0, 10).map((p) => (
          <div key={p.id} className="w-[150px] xs:w-[165px] shrink-0 snap-start">
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
        ))}
      </div>

      {/* ── Desktop View: Paginated 4-Grid with Arrows ── */}
      <div className="hidden md:block">
        <Reveal from="left">
          <div className="relative group">
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={prevPage}
              aria-label={`Previous ${title}`}
              className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110"
            >
              <ChevronLeft size={18} />
            </button>

            {/* 4 Cards Grid Layout */}
            <div className="grid grid-cols-4 gap-4 lg:gap-5">
              {visibleDesktopProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onWishlist={onWishlist}
                  wishlisted={
                    wishlist.has(p.id) ||
                    wishlist.has(String(p.id)) ||
                    ((p as any).apiId ? wishlist.has((p as any).apiId) : false)
                  }
                />
              ))}
            </div>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={nextPage}
              aria-label={`Next ${title}`}
              className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
