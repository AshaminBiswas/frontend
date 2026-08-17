import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Search, X, Plus, Check } from "lucide-react";
import { Product } from "../../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";

interface SearchDropdownProps {
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
  "304 Grade Steel",
  "316 Grade Steel",
  "Aluminium",
  "Nylon Polyamide 6",
];

export function SearchDropdown({ searchQuery, setSearchQuery, onClose, onAddToCart }: SearchDropdownProps) {
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [addedId, setAddedId] = useState<number | null>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filtered results with memoization
  const results = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return ALL_PRODUCTS.filter(
      (p) =>
        (typeof p.name === "string" && p.name.toLowerCase().includes(q)) ||
        (typeof p.category === "string" ? p.category : (p.category?.name || "")).toLowerCase().includes(q) ||
        (typeof p.material === "string" && p.material.toLowerCase().includes(q))
    ).slice(0, 5); // Display top 5 matches
  }, [searchQuery]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        onAddToCart(results[selectedIndex]);
        setAddedId(results[selectedIndex].id);
        setTimeout(() => setAddedId(null), 1200);
      }
    },
    [results, selectedIndex, onClose, onAddToCart]
  );

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div
      ref={ref}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="absolute top-full left-0 right-0 mt-2 z-50 w-full max-w-full sm:max-w-xl mx-auto bg-[#2a0e08] border border-[#EACEAA]/20 rounded-tr-3xl rounded-bl-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Quick Tags Header */}
      {!searchQuery.trim() && (
        <div className="p-4 border-b border-[#EACEAA]/10">
          <div className="flex items-center text-xs text-[#D39858] font-bold uppercase tracking-wider mb-2.5">
            <span>Popular Searches</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="text-xs bg-[#EACEAA]/10 text-[#EACEAA]/80 hover:text-[#D39858] hover:bg-[#EACEAA]/15 px-3 py-1.5 rounded-full border border-[#EACEAA]/15 transition-all duration-200 active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      {searchQuery.trim() && (
        <div className="p-3 max-h-[380px] overflow-y-auto scrollbar-hide space-y-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[11px] uppercase tracking-widest text-[#EACEAA]/50 font-semibold">
              Matching Hardware ({results.length})
            </span>
            {results.length > 0 && (
              <span className="text-[10px] text-[#D39858]/80 font-medium">Use ↑↓ keys & Enter</span>
            )}
          </div>

          {results.map((p, i) => {
            const isSelected = i === selectedIndex;
            const isAdded = addedId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => handleAdd(p)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center gap-3 p-2.5 rounded-tr-2xl rounded-bl-2xl cursor-pointer transition-all duration-150 ${
                  isSelected ? "bg-[#EACEAA]/15 border border-[#D39858]/40" : "hover:bg-[#EACEAA]/10 border border-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-tr-xl rounded-bl-xl overflow-hidden bg-[#EACEAA]/10 flex-shrink-0">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#EACEAA] text-xs md:text-sm font-semibold truncate leading-tight">
                    {p.name}
                  </p>
                  {(() => {
                    const effective = getEffectivePrice(p, user, 1, b2bCache);
                    return (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#D39858] text-xs font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{effective.unitPrice.toLocaleString("en-IN")}
                        </span>
                        {effective.isB2B ? (
                          <span className="text-[8px] bg-[#D39858] text-[#34150F] px-1 py-0.2 rounded font-black uppercase">
                            B2B
                          </span>
                        ) : effective.originalPrice > effective.unitPrice ? (
                          <span className="text-[#EACEAA]/40 text-[10px] line-through">
                            ₹{effective.originalPrice.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                        {p.material && (
                          <span className="text-[10px] bg-[#D39858]/20 text-[#D39858] px-2 py-0.5 rounded-full font-medium truncate">
                            {p.material}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Action button micro-interaction */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(p);
                  }}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-tr-lg rounded-bl-lg transition-all duration-200 active:scale-90 ${
                    isAdded
                      ? "bg-green-600 text-white"
                      : "bg-[#D39858] text-[#34150F] hover:bg-[#EACEAA]"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={12} />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {results.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-[#EACEAA]/80 text-sm font-medium">No hardware matching "{searchQuery}"</p>
              <p className="text-[#EACEAA]/40 text-xs mt-1">Try searching for Handles, Hinges, Locks, or Steel grades.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
