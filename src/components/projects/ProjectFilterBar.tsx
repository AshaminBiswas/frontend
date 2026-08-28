import React from "react";
import { Search, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDraggableScroll } from "../../hooks/useDraggableScroll";

interface ProjectFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
  totalResults: number;
  onResetFilters: () => void;
}

export const ALL_CATEGORIES = [
  "ALL",
  "Corporate Offices & Tech Parks",
  "Government & Infrastructure",
  "Sports & Stadiums",
  "Educational Institutions",
  "Healthcare & Hospitals",
  "Commercial & Retail Malls",
  "Automotive Flagships",
  "Residential & Clubhouses",
  "Hotels & Hospitality",
  "Gym & Fitness",
];

export function ProjectFilterBar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  cities,
  totalResults,
  onResetFilters,
}: ProjectFilterBarProps) {
  const hasActiveFilters =
    Boolean(search.trim()) || selectedCategory !== "ALL" || selectedCity !== "ALL";

  // Desktop click-and-drag scroll hook
  const { containerRef, isDragging, hasMoved, scrollBy, dragProps } =
    useDraggableScroll<HTMLDivElement>();

  return (
    <div className="space-y-4 rounded-3xl bg-white border border-[#34150F]/10 p-4 sm:p-6 shadow-sm">
      {/* ─── Search & Location Dropdown ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Field */}
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by project name, client, or fitting (e.g. Siemens, Floor Spring, Wankhede)..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#85431E] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
              aria-label="Clear search text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* City Filter Dropdown */}
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E] pointer-events-none" />
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Filter projects by city"
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#85431E] transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">All Project Locations</option>
            <option value="Pan India">Pan India Projects</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Category Pills Drag & Scroll Rail (Desktop Draggable + Arrows & Mobile Touch) ─── */}
      <div className="relative group/rail flex items-center">
        {/* Left Arrow Scroll Button (Desktop) */}
        <button
          type="button"
          onClick={() => scrollBy(-220)}
          className="hidden md:flex absolute -left-2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-[#34150F] hover:scale-110 active:scale-95 transition-all items-center justify-center opacity-0 group-hover/rail:opacity-100"
          aria-label="Scroll categories left"
          title="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Draggable Category Container */}
        <div
          ref={containerRef}
          {...dragProps}
          className={`flex items-center gap-2 overflow-x-auto scrollbar-hide py-1.5 w-full select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === "ALL" ? "All Categories" : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (hasMoved.current) return; // Prevent selection trigger if user was dragging
                  onCategoryChange(cat);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 select-none ${
                  isSelected
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm border border-[#D39858]"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Scroll Button (Desktop) */}
        <button
          type="button"
          onClick={() => scrollBy(220)}
          className="hidden md:flex absolute -right-2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-[#34150F] hover:scale-110 active:scale-95 transition-all items-center justify-center opacity-0 group-hover/rail:opacity-100"
          aria-label="Scroll categories right"
          title="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ─── Active Filters Status Strip ─── */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
        <span className="font-semibold">
          Showing <span className="text-[#34150F] font-extrabold">{totalResults}</span> landmark installation
          {totalResults !== 1 ? "s" : ""}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 font-bold text-[#85431E] hover:underline"
          >
            <X size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ProjectFilterBar;
