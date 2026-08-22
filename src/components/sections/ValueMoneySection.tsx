import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "../product/ProductCard";
import { fetchApi } from "../../services/api";
import { subscribeToProductSync } from "../../services/productSyncService";
import { VALUE_MONEY_PRODUCTS } from "../../data/products";

interface ValueMoneySectionProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (p: Product | number | string) => void;
  wishlist: Set<number | string>;
  onViewAll?: (title: string) => void;
}

function normalizeRawProduct(item: any): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const finalId = item.id !== undefined && item.id !== null ? item.id : (rawId || apiIdStr || "1");

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

  const categoryName = typeof item.category === "object" && item.category?.name
    ? item.category.name
    : (typeof item.category === "string" ? item.category : "Hardware");

  return {
    ...item,
    id: finalId,
    apiId: apiIdStr,
    name: item.name || item.title || "Architectural Hardware",
    category: categoryName,
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

export function ValueMoneySection({ onAddToCart, onWishlist, wishlist }: ValueMoneySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [valueProducts, setValueProducts] = useState<Product[]>(VALUE_MONEY_PRODUCTS);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const loadProducts = () => {
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
            setValueProducts(normalized.slice(0, 8));
          } else if (valueProducts.length === 0) {
            setValueProducts(VALUE_MONEY_PRODUCTS);
          }
        } else if (valueProducts.length === 0) {
          setValueProducts(VALUE_MONEY_PRODUCTS);
        }
      })
      .catch(() => {
        if (valueProducts.length === 0) setValueProducts(VALUE_MONEY_PRODUCTS);
      });
  };

  useEffect(() => {
    loadProducts();
    return subscribeToProductSync(loadProducts);
  }, []);

  if (valueProducts.length === 0) {
    return null;
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
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Value for Money Collections
          </h2>
          <p className="text-xs text-[#85431E] mt-0.5">High-durability stainless steel & brass fittings engineered for project efficiency</p>
        </div>

        <Link
          to="/products"
          className="group relative inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-4 py-2 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-sm hover:shadow active:scale-95"
        >
          <span>View All Collections</span>
          <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Link>
      </div>

      <div className="relative group/section">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous Collection"
          className="hidden lg:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Native GPU-Accelerated Smooth Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-4 px-1"
        >
          {valueProducts.map((p) => {
            const isHovered = hoveredId === p.id;
            const isOtherHovered = hoveredId !== null && !isHovered;

            return (
              <div
                key={p.apiId || p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[calc(25%-15px)] transition-all duration-300 ease-out ${
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
          aria-label="Next Collection"
          className="hidden lg:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
