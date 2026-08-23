import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORY_OPTIONS } from "../../data/products";
import { getCategoriesApi, ApiCategory } from "../../services/categoryService";
import { Loader2, ArrowRight } from "lucide-react";

export function CategoryDropdown({ onSelectCategory }: { onSelectCategory?: (cat: string) => void }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setLoading(true);
      const data = await getCategoriesApi(1, 20);
      if (isMounted) {
        if (data && data.length > 0) {
          setCategories(data);
        }
        setLoading(false);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Display items: preference to active API categories with slugs, fallback to static defaults
  const displayItems = categories.length > 0
    ? categories.map((cat) => ({ label: cat.name, slug: cat.slug }))
    : CATEGORY_OPTIONS.map((cat) => ({ label: cat.label, slug: cat.slug || cat.label.toLowerCase().replace(/\s+/g, "-") }));

  const handleCategoryClick = (cat: { label: string; slug: string }) => {
    setOpen(false);
    if (onSelectCategory) {
      onSelectCategory(cat.label);
    }
    navigate(`/category/${cat.slug}`);
  };

  return (
    <li
      ref={ref}
      className="relative border-b md:border-b-0 border-[#EACEAA]/10"
      onMouseEnter={() => window.innerWidth >= 768 && setOpen(true)}
      onMouseLeave={() => window.innerWidth >= 768 && setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`relative flex items-center gap-1.5 whitespace-nowrap text-sm font-medium px-3 sm:px-3.5 py-3 md:py-2.5 transition-colors w-full md:w-auto text-left md:text-center group ${
          open ? "text-[#D39858]" : "text-[#EACEAA]/80 hover:text-[#D39858]"
        }`}
      >
        <span>By Category</span>
        <svg
          className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180 text-[#D39858]" : ""}`}
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#D39858] transition-all duration-300 ${
            open ? "w-4/5" : "w-0 group-hover:w-3/4"
          }`}
        />
      </button>

      {open && (
        /* Mobile: inline list below button; Desktop: absolute dropdown */
        <div className="md:absolute md:top-full md:left-0 z-50 md:min-w-[260px] md:pt-1 md:animate-in md:fade-in md:slide-in-from-top-3 md:duration-200">
          <ul className="bg-[#2a0e08] md:border md:border-[#EACEAA]/20 md:rounded-tr-2xl md:rounded-bl-2xl overflow-hidden md:shadow-2xl py-1">
            {loading && categories.length === 0 ? (
              <li className="px-5 py-3 text-xs text-[#EACEAA]/60 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#D39858]" />
                Loading categories...
              </li>
            ) : (
              <>
                {displayItems.map((cat) => (
                  <li key={cat.slug || cat.label}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full text-left px-5 py-2.5 text-sm text-[#EACEAA]/85 hover:text-[#D39858] hover:bg-[#EACEAA]/10 transition-all duration-200 flex items-center justify-between group/cat border-b border-[#EACEAA]/8"
                    >
                      <span>{cat.label}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <Link
                    to="/categories"
                    onClick={() => setOpen(false)}
                    className="w-full text-left px-5 py-2.5 text-xs font-bold text-[#D39858] hover:text-[#EACEAA] hover:bg-[#EACEAA]/10 transition-all duration-200 flex items-center justify-between"
                  >
                    <span>View All Categories</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </li>
  );
}
