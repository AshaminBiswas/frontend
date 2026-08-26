import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Package, Shield, Anchor, Layers, Box, ArrowRight } from "lucide-react";
import { Product, Material } from "../../types";
import { getAllProductsApi } from "../../services/productService";
import { subscribeToProductSync } from "../../services/productSyncService";
import { materialService } from "../../services/materialService";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import {
  MATERIAL_REGISTRY,
  isProductOfMaterial,
  resolveMaterialBySlug,
} from "../../utils/materials";

export { isProductOfMaterial };

interface MaterialsDropdownProps {
  onSelectMaterial?: (mat: string) => void;
  onCloseMenu?: () => void;
}

export function MaterialsDropdown({ onSelectMaterial, onCloseMenu }: MaterialsDropdownProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>("304-grade-stainless-steel");
  const [materialList, setMaterialList] = useState<Material[]>(() => {
    try {
      const stored = localStorage.getItem("prc_storefront_active_materials");
      return stored ? JSON.parse(stored) : (MATERIAL_REGISTRY as any);
    } catch {
      return MATERIAL_REGISTRY as any;
    }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  // Active material details
  const activeMaterial = useMemo(() => {
    const found = materialList.find((m) => m.slug === activeSlug || m.id === activeSlug);
    if (found) {
      return {
        id: found.id,
        slug: found.slug,
        name: found.name,
        shortName: found.shortName || found.name,
        gradeBadge: found.gradeBadge || "Architectural Grade",
        iconName: ((found as any).iconName as any) || "Shield",
        tagline: found.tagline || `${found.name} Hardware`,
        description: found.description || "",
        specs: found.specs || [],
      };
    }
    return resolveMaterialBySlug(activeSlug);
  }, [activeSlug, materialList]);

  // Load live active materials on mount & when dropdown opens
  useEffect(() => {
    materialService.getActiveMaterials().then((data) => {
      if (data && data.length > 0) {
        setMaterialList(data);
        if (!data.some((m) => m.slug === activeSlug || m.id === activeSlug)) {
          setActiveSlug(data[0].slug);
        }
      }
    });
  }, []);

  // Load all products on mount & subscribe to real-time admin sync
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const live = await getAllProductsApi(100);
        if (isMounted && live) {
          setProducts(live);
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
      if (isMounted && fresh) {
        setProducts(fresh);
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

  // Filter products by selected active material
  const materialProducts = useMemo(() => {
    return products.filter((p) => isProductOfMaterial(p, activeSlug));
  }, [products, activeSlug]);

  // Material item count map for badges
  const materialCounts = useMemo(() => {
    const map: Record<string, number> = {};
    materialList.forEach((mat) => {
      map[mat.slug] = products.filter((p) => isProductOfMaterial(p, mat.slug)).length;
    });
    return map;
  }, [products, materialList]);

  // Display top 6 products for currently active material
  const displayProducts = useMemo(() => {
    return materialProducts.slice(0, 6);
  }, [materialProducts]);

  const handleProductClick = (product: Product) => {
    if (onSelectMaterial) onSelectMaterial(activeMaterial.name);
    setOpen(false);
    if (onCloseMenu) onCloseMenu();
    navigate(`/product/${product.slug || product.id || product.apiId}`);
  };

  const handleMaterialNavigate = (slug: string) => {
    if (onSelectMaterial) onSelectMaterial(slug);
    setOpen(false);
    if (onCloseMenu) onCloseMenu();
    navigate(`/material/${slug}`);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Shield": return <Shield size={14} className="text-[#D39858]" />;
      case "Anchor": return <Anchor size={14} className="text-[#D39858]" />;
      case "Layers": return <Layers size={14} className="text-[#D39858]" />;
      case "Box": return <Box size={14} className="text-[#D39858]" />;
      default: return <Package size={14} className="text-[#D39858]" />;
    }
  };

  return (
    <li
      ref={ref}
      className="border-b md:border-b-0 border-[#EACEAA]/10 md:static relative"
      onMouseEnter={() => window.innerWidth >= 768 && setOpen(true)}
      onMouseLeave={() => window.innerWidth >= 768 && setOpen(false)}
    >
      {/* ── By Materials Trigger Button ── */}
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
        <span>By Materials</span>
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

      {/* ── Dynamic Mega-Menu Dropdown ── */}
      {open && (
        <div className="w-full md:absolute md:top-full md:left-0 md:right-0 md:w-full z-50 md:pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-[#240c07] md:border-t md:border-b border-[#EACEAA]/20 shadow-2xl backdrop-blur-md w-full">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-4">
              
              {/* Desktop Layout: Left Material Tabs + Right Material-Wise Product Grid */}
              <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
                
                {/* ── Left Sidebar: Material Categories ── */}
                <div className="w-full md:w-[260px] lg:w-[290px] flex-shrink-0 space-y-1 md:border-r border-[#EACEAA]/10 md:pr-4">
                  <div className="hidden md:flex items-center justify-between pb-2 mb-1 border-b border-[#EACEAA]/10">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D39858]">
                      Certified Raw Materials
                    </span>
                    <span className="text-[10px] text-[#EACEAA]/50 font-mono">
                      {products.length} Products
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {materialList.map((mat) => {
                      const isActive = activeSlug === mat.slug || activeSlug === mat.id;
                      const count = materialCounts[mat.slug] || 0;

                      return (
                        <button
                          key={mat.slug}
                          type="button"
                          onMouseEnter={() => setActiveSlug(mat.slug)}
                          onClick={() => handleMaterialNavigate(mat.slug)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-tr-xl rounded-bl-xl transition-all duration-150 flex items-center justify-between group/mat ${
                            isActive
                              ? "bg-[#D39858] text-[#34150F] font-bold shadow-md shadow-[#D39858]/20"
                              : "bg-[#1e0a06]/60 text-[#EACEAA]/85 hover:bg-[#34150F] hover:text-[#D39858]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive ? "bg-[#34150F] text-[#D39858]" : "bg-[#EACEAA]/10 text-[#D39858]"
                            }`}>
                              {renderIcon(mat.iconName)}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate leading-tight ${
                                isActive ? "text-[#34150F]" : "text-[#EACEAA] group-hover/mat:text-[#D39858]"
                              }`}>
                                {mat.name}
                              </p>
                              <p className={`text-[10px] truncate leading-none mt-0.5 ${
                                isActive ? "text-[#34150F]/80 font-semibold" : "text-[#EACEAA]/50"
                              }`}>
                                {mat.tagline}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono ${
                              isActive
                                ? "bg-[#34150F] text-[#EACEAA]"
                                : "bg-[#EACEAA]/10 text-[#EACEAA]/70"
                            }`}>
                              {count}
                            </span>
                            <ChevronRight size={13} className={`transition-transform ${
                              isActive ? "translate-x-0.5 text-[#34150F]" : "text-[#EACEAA]/30 group-hover/mat:text-[#D39858]"
                            }`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* All Materials Catalog Link */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate("/products"); }}
                      className="w-full text-center py-2 px-3 text-xs font-bold text-[#EACEAA]/70 hover:text-[#D39858] hover:bg-[#EACEAA]/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-[#EACEAA]/10"
                    >
                      <span>Explore All Products</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* ── Right Panel: Material-Wise Products Grid ── */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Panel Header */}
                  <div className="hidden md:flex items-center justify-between pb-2 mb-2 border-b border-[#EACEAA]/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#EACEAA]">
                        {activeMaterial.name} Collection
                      </span>
                      <span className="bg-[#D39858]/15 border border-[#D39858]/30 text-[#D39858] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {activeMaterial.gradeBadge}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMaterialNavigate(activeMaterial.slug)}
                      className="text-xs font-bold text-[#D39858] hover:text-[#EACEAA] flex items-center gap-1 transition-colors group/view"
                    >
                      <span>Open {activeMaterial.shortName} Page ({materialProducts.length})</span>
                      <ChevronRight size={12} className="group-hover/view:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Products Grid */}
                  {loading && displayProducts.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2 bg-[#34150F]/40 rounded-tr-lg rounded-bl-lg border border-[#EACEAA]/8 animate-pulse">
                          <div className="w-12 h-12 rounded-tr-md rounded-bl-md bg-[#EACEAA]/10 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="h-3 w-3/4 bg-[#EACEAA]/15 rounded" />
                            <div className="h-2.5 w-1/2 bg-[#EACEAA]/10 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : displayProducts.length === 0 ? (
                    <div className="p-8 text-center bg-[#1e0a06]/40 rounded-2xl border border-[#EACEAA]/10 my-auto">
                      <Package size={28} className="mx-auto mb-2 text-[#D39858]/60" />
                      <p className="text-xs font-bold text-[#EACEAA]">No products tagged with {activeMaterial.name}</p>
                      <p className="text-[11px] text-[#EACEAA]/50 mt-1">Check out our general catalog for all architectural hardware.</p>
                      <button
                        type="button"
                        onClick={() => { setOpen(false); navigate("/products"); }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D39858] text-[#34150F] text-xs font-bold rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-colors"
                      >
                        <span>View All Products</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {displayProducts.map((prod) => {
                        const effective = getEffectivePrice(prod, user, 1, b2bCache);
                        const price = effective.unitPrice;
                        const origPrice = effective.originalPrice;
                        const hasDiscount = origPrice > price;
                        const discount = effective.isB2B
                          ? effective.b2bDiscountPercent
                          : (hasDiscount ? Math.round(((origPrice - price) / origPrice) * 100) : (prod.discount || 0));
                        const catName = typeof prod.category === "object" ? (prod.category as any).name : (prod.category || "Hardware");

                        return (
                          <button
                            key={prod.id || prod.apiId || prod.name}
                            type="button"
                            onClick={() => handleProductClick(prod)}
                            className="w-full text-left p-2.5 bg-[#1e0a06]/90 hover:bg-[#34150F] active:bg-[#34150F] rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/10 hover:border-[#D39858]/60 transition-all duration-150 flex items-center gap-3 group/item cursor-pointer shadow-sm hover:shadow-md"
                          >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-tr-md rounded-bl-md bg-[#EACEAA]/10 border border-[#EACEAA]/15 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                />
                              ) : (
                                <Package size={20} className="text-[#D39858]/60" />
                              )}
                              {discount > 0 && (
                                <span className="absolute top-0.5 left-0.5 bg-[#34150F]/95 text-[#D39858] text-[7px] font-black px-1 rounded-sm border border-[#D39858]/30 leading-none">
                                  {effective.isB2B ? `B2B ${discount}%` : `${discount}%`}
                                </span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#EACEAA] group-hover/item:text-[#D39858] transition-colors truncate leading-tight">
                                {prod.name}
                              </p>
                              
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-[#EACEAA]/60 truncate font-medium">
                                  {catName}
                                </span>
                                <span className="text-[8px] bg-[#EACEAA]/10 text-[#D39858] px-1 rounded font-bold">
                                  {activeMaterial.shortName}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xs font-black text-[#D39858] leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
                                  ₹{price.toLocaleString("en-IN")}
                                </span>
                                {effective.isB2B ? (
                                  <span className="bg-[#D39858] text-[#34150F] text-[7px] font-black px-1 py-0.2 rounded leading-none uppercase">
                                    B2B
                                  </span>
                                ) : hasDiscount && (
                                  <span className="text-[9px] text-[#EACEAA]/40 line-through font-semibold leading-none">
                                    ₹{origPrice.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chevron */}
                            <div className="w-5 h-5 rounded-full bg-[#EACEAA]/5 group-hover/item:bg-[#D39858] group-hover/item:text-[#34150F] text-[#EACEAA]/40 flex items-center justify-center transition-all flex-shrink-0">
                              <ChevronRight size={11} className="group-hover/item:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Panel Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#EACEAA]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-[#EACEAA]/60">
                      Showing certified <strong className="text-[#EACEAA]">{activeMaterial.name}</strong> items
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMaterialNavigate(activeMaterial.slug)}
                      className="font-bold text-[#D39858] hover:text-[#EACEAA] flex items-center gap-1.5 transition-colors"
                    >
                      <span>View All {activeMaterial.name} Products ({materialProducts.length})</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </li>
  );
}
