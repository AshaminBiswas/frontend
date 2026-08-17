import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Product } from "../../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";

interface SearchOverlayProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}

const ALL_PRODUCTS: Product[] = [
  ...SUPER_SAVER_PRODUCTS,
  ...VALUE_MONEY_PRODUCTS,
  ...BEST_SELLER_PRODUCTS,
];

const POPULAR_SUGGESTIONS = [
  "Cabinet Handles",
  "Door Hinges",
  "Drawer Knobs",
  "Smart Locks",
  "Brass Fittings",
  "304 Grade Steel",
  "316 Grade Steel",
  "Aluminium",
  "Nylon Polyamide 6",
  "Locker Hardware",
];

export function SearchOverlay({ searchQuery, setSearchQuery, onClose, onAddToCart }: SearchOverlayProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const results = ALL_PRODUCTS.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      (typeof p.name === "string" && p.name.toLowerCase().includes(q)) ||
      (typeof p.category === "string" ? p.category : (p.category?.name || "")).toLowerCase().includes(q) ||
      (typeof p.material === "string" && p.material.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#34150F]"
      style={{ animation: "fadeSlideDown 0.25s ease-out" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 md:px-12 py-4 border-b border-[#EACEAA]/10">
        <div className="relative flex-1 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search handles, hinges, locks, materials..."
            className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 pl-11 pr-4 py-3 rounded-tr-2xl rounded-bl-2xl text-base border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858] transition-colors"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D39858]" />
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            setSearchQuery("");
          }}
          className="text-[#EACEAA]/70 hover:text-[#D39858] transition-colors flex-shrink-0"
          aria-label="Close search"
        >
          <X size={26} />
        </button>
      </div>

      {/* Main search body */}
      <div className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 overflow-y-auto">
        <p className="text-[#EACEAA]/40 text-xs uppercase tracking-widest mb-4">Popular Searches</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {POPULAR_SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setSearchQuery(term)}
              className="bg-[#EACEAA]/10 text-[#EACEAA]/75 text-sm px-4 py-2 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/15 hover:bg-[#D39858]/20 hover:text-[#D39858] hover:border-[#D39858]/30 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        {searchQuery.trim() && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#EACEAA]/60 text-xs uppercase tracking-widest">
                Results for "{searchQuery}" ({results.length})
              </p>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#D39858] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-tr-2xl rounded-bl-2xl bg-[#EACEAA]/8 hover:bg-[#EACEAA]/15 transition-colors cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-tr-xl rounded-bl-xl overflow-hidden bg-[#EACEAA]/10 flex-shrink-0">
                    <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  {(() => {
                    const effective = getEffectivePrice(p, user, 1, b2bCache);
                    return (
                      <div className="flex-1 min-w-0">
                        <p className="text-[#EACEAA] text-sm font-medium truncate group-hover:text-[#D39858] transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[#D39858] text-xs mt-0.5 font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{effective.unitPrice.toLocaleString("en-IN")}{" "}
                          {effective.isB2B ? (
                            <span className="text-[8px] bg-[#D39858] text-[#34150F] px-1 py-0.2 rounded font-black uppercase ml-1">
                              B2B
                            </span>
                          ) : effective.originalPrice > effective.unitPrice ? (
                            <span className="text-[#EACEAA]/40 line-through font-normal ml-1">
                              ₹{effective.originalPrice.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(p);
                    }}
                    className="bg-[#D39858] text-[#34150F] text-xs font-bold px-2.5 py-1.5 rounded-tr-lg rounded-bl-lg hover:bg-[#EACEAA] transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}

              {results.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-[#EACEAA]/60 text-base mb-1">No hardware found matching "{searchQuery}"</p>
                  <p className="text-[#EACEAA]/40 text-xs">Try searching by category (Handles, Locks, Hinges) or material.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
