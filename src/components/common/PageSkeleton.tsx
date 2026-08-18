import React from "react";

export function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
      {/* Hero / Banner Skeleton */}
      <div className="w-full h-48 md:h-64 bg-[#34150F]/10 rounded-tr-3xl rounded-bl-3xl" />

      {/* Grid Header Skeleton */}
      <div className="flex items-center justify-between py-2">
        <div className="h-6 w-48 bg-[#34150F]/15 rounded-md" />
        <div className="h-5 w-24 bg-[#34150F]/10 rounded-md" />
      </div>

      {/* Product Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-[#f5e8d4]/60 border border-[rgba(52,21,15,0.08)] rounded-tr-2xl rounded-bl-2xl p-3 space-y-3"
          >
            <div className="w-full aspect-square bg-[#34150F]/10 rounded-tr-xl rounded-bl-xl" />
            <div className="h-4 w-3/4 bg-[#34150F]/15 rounded" />
            <div className="h-3 w-1/2 bg-[#34150F]/10 rounded" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-16 bg-[#34150F]/20 rounded" />
              <div className="h-7 w-7 bg-[#34150F]/15 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
