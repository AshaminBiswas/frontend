import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Percent } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "../product/ProductCard";
import { fetchApi } from "../../services/api";
import { couponService, Coupon } from "../../services/couponService";
import { subscribeToProductSync } from "../../services/productSyncService";

interface SuperSaverSectionProps {
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

  const calculatedDiscount = item.discount
    ? Number(item.discount)
    : effectiveRegular > effectiveSale
    ? Math.round(((effectiveRegular - effectiveSale) / effectiveRegular) * 100)
    : 0;

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
    discount: calculatedDiscount,
    image,
    material: item.material || item.specifications?.material || "Stainless Steel / Brass",
    b2bPrice: item.b2bPrice !== undefined ? Number(item.b2bPrice) : (item.b2b_price !== undefined ? Number(item.b2b_price) : undefined),
  };
}

export function SuperSaverSection({ onAddToCart, onWishlist, wishlist }: SuperSaverSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const loadOffers = async () => {
    try {
      const [pRes, cRes] = await Promise.allSettled([
        fetchApi<any>("/products?limit=100"),
        couponService.getPublicCoupons(),
      ]);

      let rawProducts: any[] = [];
      if (pRes.status === "fulfilled" && pRes.value && pRes.value.success && pRes.value.data) {
        const d = pRes.value.data;
        rawProducts = Array.isArray(d.products)
          ? d.products
          : Array.isArray(d)
          ? d
          : Array.isArray(d.items)
          ? d.items
          : [];
      }

      // Collect target product IDs from active public coupons
      const targetCouponProductIds = new Set<string>();
      if (cRes.status === "fulfilled" && cRes.value && cRes.value.success && Array.isArray(cRes.value.data)) {
        cRes.value.data.forEach((coupon: any) => {
          if (Array.isArray(coupon.applicableProductIds)) {
            coupon.applicableProductIds.forEach((pid: string) => targetCouponProductIds.add(String(pid)));
          }
        });
      }

      if (rawProducts.length > 0) {
        const normalized = rawProducts.map(normalizeRawProduct);

        // Filter products with active offers, selective coupon links, or discounted rates
        const markedOffers = normalized.filter((p) => {
          const isMarked = p.isInOffer === true;
          const hasOfferTag = Array.isArray(p.tags) && p.tags.some((t: string) => {
            const s = String(t).toLowerCase();
            return s.includes("offer") || s.includes("sale") || s.includes("deal") || s.includes("saver");
          });
          const hasDiscount = (p.discount && p.discount > 0) || (p.regularPrice && p.price && p.regularPrice > p.price);
          const isCouponTarget = targetCouponProductIds.has(String(p.id)) || (p.apiId ? targetCouponProductIds.has(String(p.apiId)) : false);
          return isMarked || hasOfferTag || hasDiscount || isCouponTarget;
        });

        // Sort by highest discount rate
        markedOffers.sort((a, b) => (b.discount || 0) - (a.discount || 0));

        // If marked offers exist, display them; otherwise display top products with best value
        setOfferProducts(markedOffers.length > 0 ? markedOffers : normalized.slice(0, 10));
      } else {
        setOfferProducts([]);
      }
    } catch (err) {
      console.warn("[SuperSaverSection Load Error]:", err);
      setOfferProducts([]);
    }
  };

  useEffect(() => {
    loadOffers();
    return subscribeToProductSync(loadOffers);
  }, []);

  if (offerProducts.length === 0) {
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
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#85431E]/10 text-[#85431E] flex items-center justify-center">
              <Sparkles size={16} />
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Super Saver Offers
            </h2>
          </div>
          <p className="text-xs text-[#85431E] mt-1">Direct factory promotional deals, volume bundles & limited-time price drops</p>
        </div>

        {/* Clicking View All navigates directly to /offers */}
        <Link
          to="/offers"
          className="group relative inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#85431E] hover:text-[#34150F] px-4 py-2 rounded-full border border-[#85431E]/20 hover:border-[#34150F] transition-all duration-300 ease-out hover:bg-[#34150F]/5 shadow-sm hover:shadow active:scale-95"
        >
          <span>View All Offers</span>
          <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Link>
      </div>

      <div className="relative group/section">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous Offer"
          className="hidden lg:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Native GPU-Accelerated Smooth Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-4 px-1"
        >
          {offerProducts.map((p) => {
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
          aria-label="Next Offer"
          className="hidden lg:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] rounded-full shadow-2xl items-center justify-center transition-all duration-200 border border-[#EACEAA]/20 hover:scale-110 active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
