import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { Product } from "../../types";
import { getAllProductsApi } from "../../services/productService";
import { getLiveCatalog, subscribeToProductSync } from "../../services/productSyncService";
import {
  CUBICLE_HARDWARE_PRODUCTS,
  LOCKER_HARDWARE_PRODUCTS,
  SUPER_SAVER_PRODUCTS,
  VALUE_MONEY_PRODUCTS,
  BEST_SELLER_PRODUCTS,
} from "../../data/products";

const BASELINE_PRODUCTS: Product[] = [
  ...CUBICLE_HARDWARE_PRODUCTS,
  ...LOCKER_HARDWARE_PRODUCTS,
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

interface ProductsDropdownProps {
  onSelectProduct?: (prod: string) => void;
}

export function ProductsDropdown({ onSelectProduct }: ProductsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("prc_cached_products_list");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return getLiveCatalog(parsed);
      }
    } catch {}
    return getLiveCatalog(BASELINE_PRODUCTS);
  });
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  // Load all products on mount & subscribe to real-time admin sync
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const live = await getAllProductsApi(100);
        if (isMounted && live && live.length > 0) {
          setProducts(getLiveCatalog(live));
        }
      } catch {
        // keep fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    const unsubscribe = subscribeToProductSync(async () => {
      const fresh = await getAllProductsApi(100);
      if (isMounted && fresh && fresh.length > 0) {
        setProducts(getLiveCatalog(fresh));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 100% Dynamic: Select up to 8 products maximum displayed in 2 columns
  const displayProducts = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  const handleProductClick = (product: Product) => {
    if (onSelectProduct) onSelectProduct(product.name);
    setOpen(false);
    navigate(`/product/${product.id || product.apiId || product.slug}`);
  };

  return (
    <li
      ref={ref}
      className="border-b md:border-b-0 border-[#EACEAA]/10 md:static relative"
      onMouseEnter={() => window.innerWidth >= 768 && setOpen(true)}
      onMouseLeave={() => window.innerWidth >= 768 && setOpen(false)}
    >
      {/* ── Products Tab Trigger ── */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`relative flex items-center justify-between md:justify-start gap-1.5 whitespace-nowrap text-sm font-semibold md:font-medium px-5 md:px-3 sm:px-3.5 py-3.5 md:py-2.5 transition-colors w-full md:w-auto text-left md:text-center group ${
          open ? "text-[#D39858] bg-[#EACEAA]/5 md:bg-transparent" : "text-[#EACEAA]/80 hover:text-[#D39858]"
        }`}
      >
        <span>Products</span>
        <svg
          className={`w-3.5 h-3.5 md:w-3 md:h-3 transition-transform duration-300 ${open ? "rotate-180 text-[#D39858]" : ""}`}
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className={`hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#D39858] transition-all duration-300 ${
            open ? "w-4/5" : "w-0 group-hover:w-3/4"
          }`}
        />
      </button>

      {/* ── Dynamic Dropdown Menu (Full Width on Desktop/Tablet, Full Width of Mobile Drawer on Small Devices) ── */}
      {open && (
        <div className="w-full md:absolute md:top-full md:left-0 md:right-0 md:w-full z-50 md:pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-[#240c07] md:border-t md:border-b border-[#EACEAA]/20 shadow-2xl backdrop-blur-md w-full">
            
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
              {/* Products Grid: 1-col on mobile taking 100% full width, 2-col on tablet (md), 4-col on desktop (lg) */}
              {loading && displayProducts.length === 0 ? (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 max-h-[340px] md:max-h-none overflow-y-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="w-full flex items-center gap-2.5 p-2 bg-[#34150F]/40 rounded-tr-lg rounded-bl-lg border border-[#EACEAA]/8 animate-pulse">
                      <div className="w-11 h-11 rounded-tr-md rounded-bl-md bg-[#EACEAA]/10 flex-shrink-0" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="h-2.5 w-3/4 bg-[#EACEAA]/15 rounded" />
                        <div className="h-2 w-1/2 bg-[#EACEAA]/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayProducts.length === 0 ? (
                <div className="p-4 text-center text-[#EACEAA]/70 text-xs w-full">
                  <Package size={24} className="mx-auto mb-1.5 text-[#D39858]/60" />
                  <p>No products currently available.</p>
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 max-h-[340px] md:max-h-none overflow-y-auto pr-0.5 md:pr-0">
                  {displayProducts.map((prod) => {
                    const price = prod.price || prod.salePrice || 0;
                    const origPrice = prod.originalPrice || prod.regularPrice || 0;
                    const hasDiscount = origPrice > price;
                    const discount = prod.discount || (hasDiscount ? Math.round(((origPrice - price) / origPrice) * 100) : 0);
                    const catName = typeof prod.category === "object" ? (prod.category as any).name : (prod.category || "Hardware");

                    return (
                      <button
                        key={prod.id || prod.apiId || prod.name}
                        type="button"
                        onClick={() => handleProductClick(prod)}
                        className="w-full text-left p-2 bg-[#1e0a06]/90 hover:bg-[#34150F] active:bg-[#34150F] rounded-tr-lg rounded-bl-lg border border-[#EACEAA]/10 hover:border-[#D39858]/50 transition-all duration-150 flex items-center gap-2.5 group/item cursor-pointer shadow-sm hover:shadow"
                      >
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-tr-md rounded-bl-md bg-[#EACEAA]/10 border border-[#EACEAA]/15 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <Package size={18} className="text-[#D39858]/60" />
                          )}
                          {discount > 0 && (
                            <span className="absolute top-0.5 left-0.5 bg-[#34150F]/90 text-[#D39858] text-[7px] font-black px-0.5 rounded-sm border border-[#D39858]/30 leading-none">
                              {discount}%
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs font-bold text-[#EACEAA] group-hover/item:text-[#D39858] transition-colors truncate leading-tight">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] text-[#EACEAA]/60 truncate font-medium leading-none">
                              {catName}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-[11px] sm:text-xs font-black text-[#D39858] leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
                              ₹{price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-[8px] sm:text-[9px] text-[#EACEAA]/40 line-through font-semibold leading-none">
                                ₹{origPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chevron Icon */}
                        <div className="w-5 h-5 rounded-full bg-[#EACEAA]/5 group-hover/item:bg-[#D39858] group-hover/item:text-[#34150F] text-[#EACEAA]/40 flex items-center justify-center transition-all flex-shrink-0">
                          <ChevronRight size={11} className="group-hover/item:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom Bar */}
              <div className="w-full mt-2 pt-2 border-t border-[#EACEAA]/10 flex items-center justify-center sm:justify-end text-[11px]">
                <Link
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto text-center font-bold text-[#D39858] hover:text-[#EACEAA] flex items-center justify-center gap-1 transition-colors py-1.5 px-2 bg-[#34150F]/50 sm:bg-transparent rounded-lg sm:rounded-none border border-[#EACEAA]/10 sm:border-0"
                >
                  <span>Explore Full Catalog ({products.length} Products)</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}
    </li>
  );
}
