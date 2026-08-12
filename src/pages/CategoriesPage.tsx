import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Grid, ChevronRight, Loader2, Tag } from "lucide-react";
import { CATEGORY_OPTIONS, PRODUCT_SUB_CATEGORIES } from "../data/products";
import { getCategoriesApi, ApiCategory } from "../services/categoryService";

export function CategoriesPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

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

  const displayList = categories.length > 0
    ? categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        status: cat.status,
        productCount: cat.productCount || 0,
      }))
    : CATEGORY_OPTIONS.map((cat, idx) => ({
        id: String(idx + 1),
        name: cat.label,
        slug: cat.label.toLowerCase().replace(/\s+/g, "-"),
        status: "ACTIVE",
        productCount: 0,
      }));

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-5 sm:py-8 px-3 sm:px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Hardware Categories Catalog
          </h1>
          <p className="text-xs font-semibold text-[#85431E] mt-1">
            Browse through specialized hardware lines for Cubicles, Lockers, Urinals, and Commercial Interiors.
          </p>
        </div>

        {/* Categories Grid */}
        {loading && categories.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/8 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-tr-xl rounded-bl-xl bg-[#34150F]/10" />
                  <div className="w-16 h-4 bg-[#34150F]/10 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-[#34150F]/15 rounded-lg" />
                <div className="h-4 w-full bg-[#34150F]/10 rounded" />
                <div className="h-4 w-24 bg-[#D39858]/30 rounded-lg pt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayList.map((cat, idx) => (
              <Link
                key={cat.id || cat.name}
                to={`/category/${cat.slug}`}
                className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/8 hover:shadow-lg hover:border-[#D39858] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-tr-xl rounded-bl-xl bg-[#EACEAA]/40 text-[#D39858] flex items-center justify-center font-black text-sm group-hover:bg-[#34150F] transition-colors">
                      0{idx + 1}
                    </div>
                    {cat.status === "INACTIVE" && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-[#34150F] group-hover:text-[#D39858] transition-colors mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#85431E]/70 mb-4">
                    Commercial grade architectural hardware engineered for heavy daily utilization.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D39858] group-hover:translate-x-1 transition-transform">
                  Explore Category <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Subcategories / Product Lines */}
        <div className="bg-white rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 shadow-sm border border-[#34150F]/8">
          <h2 className="text-lg font-black text-[#34150F] mb-4 flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
            <Grid size={18} className="text-[#D39858]" /> Specialised Product Lines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PRODUCT_SUB_CATEGORIES.map((sub) => (
              <Link
                key={sub.label}
                to={`/products?search=${encodeURIComponent(sub.label)}`}
                className="bg-[#EACEAA]/30 hover:bg-[#34150F] text-[#34150F] hover:text-[#EACEAA] p-3 rounded-tr-xl rounded-bl-xl text-center text-xs font-bold transition-colors border border-[#34150F]/8"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
