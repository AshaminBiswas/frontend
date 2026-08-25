import React from "react";

export function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-8 animate-pulse space-y-4 sm:space-y-6">
      {/* Hero / Banner Skeleton */}
      <div className="w-full h-32 sm:h-48 md:h-64 bg-[#34150F]/10 rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl" />

      {/* Grid Header Skeleton */}
      <div className="flex items-center justify-between py-1 sm:py-2">
        <div className="h-5 sm:h-6 w-36 sm:w-48 bg-[#34150F]/15 rounded-md" />
        <div className="h-4 sm:h-5 w-16 sm:w-24 bg-[#34150F]/10 rounded-md" />
      </div>

      {/* Product Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-[#f5e8d4]/60 border border-[rgba(52,21,15,0.08)] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-2 sm:p-3 space-y-2 sm:space-y-3"
          >
            <div className="w-full aspect-square bg-[#34150F]/10 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl" />
            <div className="h-3.5 sm:h-4 w-3/4 bg-[#34150F]/15 rounded" />
            <div className="h-2.5 sm:h-3 w-1/2 bg-[#34150F]/10 rounded" />
            <div className="flex items-center justify-between pt-1 sm:pt-2">
              <div className="h-4 sm:h-5 w-12 sm:w-16 bg-[#34150F]/20 rounded" />
              <div className="h-6 w-6 sm:h-7 sm:w-7 bg-[#34150F]/15 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
