import React from "react";

/* ── Reusable Mobile-First Shimmer Product Card Skeleton ── */
export function ProductCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[145px] xs:w-[160px] sm:w-[260px] md:w-[300px] lg:w-[calc(25%-15px)] bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-1.5 sm:p-3 border border-[rgba(52,21,15,0.08)] shadow-2xs space-y-2 flex flex-col justify-between animate-shimmer">
      <div className="space-y-2">
        {/* Thumbnail Image Box */}
        <div className="relative w-full aspect-square bg-[#34150F]/10 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl overflow-hidden">
          {/* Discount badge placeholder */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-8 sm:w-12 h-3.5 sm:h-4 bg-[#85431E]/20 rounded-tr-sm rounded-bl-sm" />
          {/* Wishlist heart placeholder */}
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-7 sm:h-7 bg-[#34150F]/10 rounded-full" />
        </div>

        {/* Product Details */}
        <div className="space-y-1 sm:space-y-1.5 px-0.5">
          <div className="h-3 sm:h-4 w-4/5 bg-[#34150F]/15 rounded" />
          <div className="h-2.5 sm:h-3 w-1/2 bg-[#34150F]/10 rounded" />
          
          {/* Rating stars */}
          <div className="flex gap-0.5 pt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#D39858]/20 rounded-xs" />
            ))}
          </div>

          {/* Price line */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="h-3.5 sm:h-4 w-12 sm:w-16 bg-[#34150F]/20 rounded" />
            <div className="h-2.5 sm:h-3 w-8 sm:w-10 bg-[#85431E]/10 rounded" />
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="h-6 sm:h-9 w-full bg-[#34150F]/15 rounded-tr-md rounded-bl-md sm:rounded-tr-xl sm:rounded-bl-xl mt-1" />
    </div>
  );
}

/* ── Section Strip Skeleton (for Super Saver, Value for Money, Best Sellers) ── */
export function ProductSectionSkeleton({ titleWidth = "w-44" }: { titleWidth?: string }) {
  return (
    <div className="py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-8 lg:px-16 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#85431E]/10" />
          <div className={`h-5 sm:h-7 ${titleWidth} sm:w-60 bg-[#34150F]/15 rounded-lg animate-shimmer`} />
        </div>
        <div className="h-6 sm:h-8 w-14 sm:w-28 rounded-full bg-[#85431E]/10" />
      </div>

      {/* Product Cards Row */}
      <div className="flex gap-2 sm:gap-5 overflow-hidden py-1 sm:py-2 px-0.5">
        {[1, 2, 3, 4].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Full-Page Mobile-First Production-Ready Skeleton ── */
export function HomePageSkeleton() {
  return (
    <div className="w-full bg-[#EACEAA]/20 overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ── 1. Hero Slider Skeleton — 750×280 on mobile, 1024×383 on desktop ── */}
      <section className="relative overflow-hidden w-full bg-[#240c07] aspect-[750/280] md:aspect-[1024/383] animate-shimmer">
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 sm:pb-10 md:justify-center md:pb-0 px-4 sm:px-8 md:px-12 lg:px-16 space-y-2 sm:space-y-3 max-w-lg pointer-events-none">
          <div className="h-4 sm:h-5 w-24 sm:w-28 bg-[#D39858]/30 rounded-full" />
          <div className="space-y-1.5 sm:space-y-2">
            <div className="h-5 sm:h-8 md:h-10 w-4/5 bg-[#EACEAA]/20 rounded-lg" />
            <div className="h-4 sm:h-6 md:h-7 w-1/2 bg-[#EACEAA]/15 rounded-lg" />
          </div>
          <div className="pt-1.5 sm:pt-2">
            <div className="h-7 sm:h-10 w-28 sm:w-40 bg-[#D39858]/35 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl" />
          </div>
        </div>

        {/* Bottom Right Slide Indicator Skeleton */}
        <div className="absolute bottom-2 sm:bottom-4 right-2.5 sm:right-6 md:right-8 z-20 flex items-center gap-1.5 sm:gap-2 bg-[#34150F]/60 backdrop-blur-md p-1 sm:p-1.5 px-2 sm:px-3.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[#EACEAA]/10">
          <div className="h-3 w-7 sm:w-10 bg-white/15 rounded" />
          <div className="h-3 w-px bg-white/15" />
          <div className="h-4 w-4 sm:h-6 sm:w-6 bg-white/15 rounded" />
          <div className="h-4 w-4 sm:h-6 sm:w-6 bg-white/15 rounded" />
        </div>
      </section>

      {/* ── 2. Upcoming Slider Skeleton ── */}
      <section className="py-4 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="h-6 w-24 bg-[#85431E]/20 rounded-tr-md rounded-bl-md" />
          <div className="h-px flex-1 bg-[#34150F]/10" />
        </div>
        <div className="w-full h-[140px] xs:h-[160px] sm:h-[220px] md:h-[280px] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl bg-[#240c07] animate-shimmer relative p-4 sm:p-6 md:p-10 flex flex-col justify-center">
          <div className="h-3.5 sm:h-4 w-16 sm:w-20 bg-[#D39858]/25 rounded mb-2" />
          <div className="h-5 sm:h-8 w-2/3 sm:w-1/2 bg-[#EACEAA]/20 rounded-lg" />
        </div>
      </section>

      {/* ── 3. Shop by Aesthetic Skeleton ── */}
      <section className="py-3 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
        <div className="h-5 sm:h-7 w-40 sm:w-48 bg-[#34150F]/15 rounded-lg mb-3 sm:mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[130px] sm:h-[180px] md:h-[260px] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl bg-[#34150F]/12 animate-shimmer p-3 sm:p-5 flex flex-col justify-end gap-1.5 sm:gap-2"
            >
              <div className="h-4 sm:h-6 w-28 sm:w-36 bg-[#EACEAA]/25 rounded-md" />
              <div className="h-6 sm:h-8 w-20 sm:w-24 bg-[#EACEAA]/35 rounded-tr-md rounded-bl-md sm:rounded-tr-xl sm:rounded-bl-xl" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Super Saver Offers Skeleton ── */}
      <div className="bg-[#34150F]/8 py-1 sm:py-2">
        <ProductSectionSkeleton titleWidth="w-48" />
      </div>

      {/* ── 5. Cubicle Hardware Collection Skeleton ── */}
      <section className="py-3 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
        <div className="h-5 sm:h-7 w-52 sm:w-64 bg-[#34150F]/15 rounded-lg mb-3 sm:mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full h-[140px] sm:h-[200px] md:h-[280px] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl bg-[#34150F]/12 animate-shimmer p-3.5 sm:p-6 flex flex-col justify-end gap-1.5 sm:gap-2"
            >
              <div className="h-4 sm:h-6 w-32 sm:w-44 bg-[#EACEAA]/25 rounded-md" />
              <div className="h-6 sm:h-8 w-20 sm:w-24 bg-[#EACEAA]/35 rounded-tr-md rounded-bl-md sm:rounded-tr-xl sm:rounded-bl-xl" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Value for Money Skeleton ── */}
      <div className="bg-[#34150F]/8 py-1 sm:py-2">
        <ProductSectionSkeleton titleWidth="w-44" />
      </div>

      {/* ── 7. Locker Hardware Collection Skeleton ── */}
      <section className="py-3 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
        <div className="h-5 sm:h-7 w-48 sm:w-60 bg-[#34150F]/15 rounded-lg mb-3 sm:mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full h-[140px] sm:h-[200px] md:h-[280px] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl bg-[#34150F]/12 animate-shimmer p-3.5 sm:p-6 flex flex-col justify-end gap-1.5 sm:gap-2"
            >
              <div className="h-4 sm:h-6 w-32 sm:w-44 bg-[#EACEAA]/25 rounded-md" />
              <div className="h-6 sm:h-8 w-20 sm:w-24 bg-[#EACEAA]/35 rounded-tr-md rounded-bl-md sm:rounded-tr-xl sm:rounded-bl-xl" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Best Sellers Skeleton ── */}
      <div className="bg-[#34150F]/8 py-1 sm:py-2">
        <ProductSectionSkeleton titleWidth="w-36" />
      </div>

      {/* ── 9. Testimonial Section Skeleton ── */}
      <section className="py-6 sm:py-10 md:py-12 px-3 sm:px-6 md:px-8 lg:px-16 bg-[#34150F] overflow-hidden">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="h-5 sm:h-7 w-36 sm:w-48 bg-[#EACEAA]/20 rounded-lg" />
          <div className="flex gap-1.5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-tr-md rounded-bl-md bg-[#EACEAA]/15" />
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-tr-md rounded-bl-md bg-[#EACEAA]/15" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#85431E]/20 border border-[#EACEAA]/10 rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl p-3.5 sm:p-6 space-y-2.5 animate-shimmer"
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-3 h-3 bg-[#D39858]/30 rounded-full" />
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 sm:h-3 w-full bg-[#EACEAA]/15 rounded" />
                <div className="h-2.5 sm:h-3 w-4/5 bg-[#EACEAA]/15 rounded" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#EACEAA]/20" />
                <div className="space-y-1">
                  <div className="h-2.5 sm:h-3 w-20 bg-[#EACEAA]/20 rounded" />
                  <div className="h-2 w-14 bg-[#EACEAA]/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PageSkeleton() {
  return <HomePageSkeleton />;
}
