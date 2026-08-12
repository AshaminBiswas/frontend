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

  const visibleProducts = products.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <Reveal>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onViewAll && onViewAll(title)}
            className="group relative inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-4 py-2 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-sm hover:shadow active:scale-95"
          >
            <span>View All</span>
            <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
          </button>
        </div>
      </Reveal>

      <Reveal from="left">
        <div className="relative group">
          {/* Left Arrow Button — Far Left Side */}
          <button
            type="button"
            onClick={prevPage}
            aria-label={`Previous ${title}`}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-xl flex items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110"
          >
            <ChevronLeft size={20} />
          </button>

          {/* 4 Cards Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleProducts.map((p) => (
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

          {/* Right Arrow Button — Far Right Side */}
          <button
            type="button"
            onClick={nextPage}
            aria-label={`Next ${title}`}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-xl flex items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
