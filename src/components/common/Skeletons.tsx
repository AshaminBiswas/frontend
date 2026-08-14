/* ─────────────────────────────────────────────────────────────────────────────
   Skeletons.tsx — Unified shimmer skeleton components for every page/section
   All skeletons use the brand palette: #34150F / #D39858 / #EACEAA / #85431E
───────────────────────────────────────────────────────────────────────────── */

/* ── Shared shimmer base ── */
const S = "animate-pulse bg-[#34150F]/10";
const SD = "animate-pulse bg-[#EACEAA]/20"; // dark-bg variant

/* ════════════════════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════════════════════ */

export function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden w-full aspect-[1024/383] bg-[#240c07]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#240c07] via-[#3d1810] to-[#240c07] animate-pulse" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#34150F]/50" />
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 sm:pb-10 md:justify-center md:pb-0 px-4 sm:px-8 md:px-12 lg:px-16 pointer-events-none">
        <div className="space-y-3 max-w-md md:max-w-lg">
          <div className="h-5 w-28 bg-[#D39858]/20 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 sm:h-9 w-3/4 bg-[#EACEAA]/15 rounded-lg animate-pulse" />
            <div className="h-5 sm:h-7 w-1/2 bg-[#EACEAA]/10 rounded-lg animate-pulse" />
          </div>
          <div className="pt-2">
            <div className="h-9 sm:h-10 w-36 sm:w-44 bg-[#D39858]/30 rounded-tr-2xl rounded-bl-2xl animate-pulse" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-6 md:right-8 z-20 flex items-center gap-2 bg-[#34150F]/60 backdrop-blur-md p-1.5 px-3 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/10">
        <div className="h-3.5 w-12 bg-white/10 rounded animate-pulse" />
        <div className="h-3.5 w-px bg-white/10" />
        <div className="h-6 w-6 bg-white/10 rounded-md animate-pulse" />
        <div className="h-6 w-6 bg-white/10 rounded-md animate-pulse" />
      </div>
    </section>
  );
}

export function UpcomingSkeleton() {
  return (
    <section className="py-10 px-4 md:px-8 lg:px-16">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-7 w-28 bg-[#85431E]/40 rounded-tr-lg rounded-bl-lg animate-pulse" />
        <div className="h-px flex-1 bg-[#34150F]/15" />
        <div className="flex gap-2">
          <div className="w-9 h-9 border border-[#85431E]/20 rounded-tr-lg rounded-bl-lg bg-white/5 animate-pulse" />
          <div className="w-9 h-9 border border-[#85431E]/20 rounded-tr-lg rounded-bl-lg bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-tr-3xl rounded-bl-3xl h-[220px] sm:h-[280px] md:h-[340px] w-full bg-[#1e0a06] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-[#240c07] via-[#3d1810] to-[#240c07] animate-pulse" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center pl-4 sm:pl-6 md:pl-16 pr-4 sm:pr-6 max-w-xl space-y-3">
          <div className="h-4 w-24 bg-[#D39858]/20 rounded animate-pulse" />
          <div className="h-8 sm:h-10 w-3/4 bg-[#EACEAA]/15 rounded-lg animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   PRODUCT CARD (reusable)
════════════════════════════════════════════════════════ */
export function ProductCardSkeleton() {
  return (
    <div className="w-full bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-3 border border-[rgba(52,21,15,0.08)] shadow-sm space-y-3 flex flex-col">
      {/* Image */}
      <div className={`relative w-full aspect-square rounded-tr-xl rounded-bl-xl ${S} overflow-hidden`}>
        <div className="absolute top-2.5 left-2.5 w-10 h-5 bg-[#85431E]/20 rounded-tr-lg rounded-bl-lg" />
        <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#85431E]/20 rounded-full" />
      </div>
      {/* Info */}
      <div className="px-1 space-y-2 flex-1">
        <div className={`h-4 w-full ${S} rounded`} />
        <div className={`h-3 w-3/4 ${S} rounded`} />
        <div className={`h-3 w-2/3 ${S} rounded`} />
        {/* Price row */}
        <div className="flex items-center gap-2 pt-1">
          <div className={`h-5 w-16 ${S} rounded`} />
          <div className={`h-3 w-12 ${S} rounded`} />
        </div>
      </div>
      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <div className={`h-9 flex-1 ${S} rounded-tr-xl rounded-bl-xl`} />
        <div className={`h-9 w-9 ${S} rounded-tr-xl rounded-bl-xl`} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PRODUCT GRID (e.g. BestSellers, NewArrivals, Offers, Catalog)
════════════════════════════════════════════════════════ */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PRODUCT SLIDER / SECTION (Home page sections)
════════════════════════════════════════════════════════ */
export function ProductSliderSkeleton({ title }: { title?: string }) {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex items-center justify-between">
        {title ? (
          <h2 className="text-2xl md:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            {title}
          </h2>
        ) : (
          <div className={`h-8 w-52 ${S} rounded-xl`} />
        )}
        <div className={`h-8 w-24 ${S} rounded-tr-xl rounded-bl-xl`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
════════════════════════════════════════════════════════ */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA]">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pt-8 pb-4 flex items-center justify-between">
        <div className={`h-4 w-28 ${S} rounded-full`} />
        <div className={`h-4 w-48 ${S} rounded-full hidden sm:block`} />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-12">
        <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 border border-[rgba(52,21,15,0.08)] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Image */}
          <div className="lg:col-span-6 space-y-4">
            <div className={`w-full h-80 md:h-[450px] ${S} rounded-tr-2xl rounded-bl-2xl`} />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => <div key={i} className={`w-16 h-16 ${S} rounded-tr-xl rounded-bl-xl`} />)}
            </div>
          </div>
          {/* Right: Details */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className={`h-6 w-36 ${S} rounded-full`} />
              <div className={`h-5 w-20 ${S} rounded-full`} />
            </div>
            <div className={`h-9 w-3/4 ${S} rounded-xl`} />
            <div className={`h-9 w-1/2 ${S} rounded-xl`} />
            <div className="flex gap-1 items-center">
              {[1,2,3,4,5].map(s => <div key={s} className={`w-4 h-4 ${S} rounded-full`} />)}
              <div className={`h-4 w-20 ${S} rounded ml-2`} />
            </div>
            {/* Price box */}
            <div className={`${S} rounded-tr-2xl rounded-bl-2xl p-5 space-y-3`}>
              <div className="flex gap-3 items-baseline">
                <div className={`h-10 w-36 bg-[#34150F]/15 rounded-xl`} />
                <div className={`h-6 w-24 bg-[#85431E]/10 rounded-lg`} />
                <div className={`h-6 w-20 bg-emerald-100 rounded-full`} />
              </div>
              <div className={`h-4 w-64 ${S} rounded`} />
            </div>
            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <div className={`h-12 flex-1 ${S} rounded-tr-2xl rounded-bl-2xl`} />
              <div className={`h-12 w-12 ${S} rounded-tr-2xl rounded-bl-2xl`} />
            </div>
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className={`h-16 ${S} rounded-tr-xl rounded-bl-xl`} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CATEGORY PRODUCTS PAGE
════════════════════════════════════════════════════════ */
export function CategoryPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`h-6 w-20 ${S} rounded-full`} />
        <div className="h-px flex-1 bg-[#34150F]/10" />
      </div>
      {/* Banner */}
      <div className={`w-full h-40 md:h-56 ${S} rounded-tr-3xl rounded-bl-3xl mb-8`} />
      {/* Filters row */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {[1,2,3,4].map(i => <div key={i} className={`h-9 w-24 flex-shrink-0 ${S} rounded-tr-xl rounded-bl-xl`} />)}
      </div>
      {/* Grid */}
      <ProductGridSkeleton count={8} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   BEST SELLERS / NEW ARRIVALS / OFFERS PAGE
════════════════════════════════════════════════════════ */
export function ProductListPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA]">
      {/* Top banner area */}
      <div className={`w-full h-48 md:h-64 ${S}`} />
      {/* Filters / controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {[1,2,3,4,5].map(i => <div key={i} className={`h-9 w-28 ${S} rounded-tr-xl rounded-bl-xl`} />)}
        </div>
        {/* Stats row */}
        <div className="flex gap-4 mb-8">
          {[1,2,3].map(i => <div key={i} className={`h-20 w-32 ${S} rounded-tr-2xl rounded-bl-2xl`} />)}
        </div>
        <ProductGridSkeleton count={8} />
        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-10">
          {[1,2,3,4,5].map(i => <div key={i} className={`h-9 w-9 ${S} rounded`} />)}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   WISHLIST PAGE
════════════════════════════════════════════════════════ */
export function WishlistSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-10">
      <div className={`h-8 w-48 ${S} rounded-xl mb-8`} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1,2,3,4].map(i => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CART PAGE
════════════════════════════════════════════════════════ */
export function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-10">
      <div className={`h-8 w-32 ${S} rounded-xl mb-8`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className={`flex gap-4 bg-[#f5e8d4] p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)]`}>
              <div className={`w-24 h-24 ${S} rounded-tr-xl rounded-bl-xl flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`h-5 w-3/4 ${S} rounded`} />
                <div className={`h-4 w-1/2 ${S} rounded`} />
                <div className={`h-4 w-1/4 ${S} rounded`} />
              </div>
            </div>
          ))}
        </div>
        <div className={`bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 border border-[rgba(52,21,15,0.08)] h-fit space-y-4`}>
          <div className={`h-6 w-32 ${S} rounded-xl`} />
          {[1,2,3].map(i => <div key={i} className={`h-5 w-full ${S} rounded`} />)}
          <div className={`h-12 w-full ${S} rounded-tr-2xl rounded-bl-2xl`} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   AESTHETIC BANNER
════════════════════════════════════════════════════════ */
export function AestheticBannerSkeleton() {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <div className={`h-8 w-64 ${S} rounded-xl mb-8`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-full rounded-tr-3xl rounded-bl-3xl ${S} min-h-[280px] p-6 flex flex-col justify-end gap-3`}>
            <div className={`h-6 w-36 bg-[#EACEAA]/30 rounded-lg`} />
            <div className={`h-9 w-28 bg-[#EACEAA]/40 rounded-tr-xl rounded-bl-xl`} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   TESTIMONIAL SECTION
════════════════════════════════════════════════════════ */
export function TestimonialSkeleton() {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 bg-[#34150F]">
      <div className="flex items-center justify-between mb-8">
        <div className={`h-8 w-48 ${SD} rounded-xl`} />
        <div className="flex gap-2">
          <div className={`w-9 h-9 ${SD} rounded-tr-xl rounded-bl-xl`} />
          <div className={`w-9 h-9 ${SD} rounded-tr-xl rounded-bl-xl`} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#85431E]/20 border border-[#EACEAA]/10 rounded-tr-3xl rounded-bl-3xl p-6 space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`w-3.5 h-3.5 rounded-full ${SD}`} />
              ))}
            </div>
            <div className="space-y-2">
              <div className={`h-3 w-full ${SD} rounded`} />
              <div className={`h-3 w-5/6 ${SD} rounded`} />
              <div className={`h-3 w-2/3 ${SD} rounded`} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className={`w-10 h-10 rounded-full ${SD}`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-3.5 w-24 ${SD} rounded`} />
                <div className={`h-3 w-32 ${SD} rounded`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   FAQ PAGE
════════════════════════════════════════════════════════ */
export function FaqPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-12">
      <div className={`h-10 w-48 mx-auto ${S} rounded-xl mb-4`} />
      <div className={`h-4 w-72 mx-auto ${S} rounded mb-12`} />
      <div className="max-w-3xl mx-auto space-y-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className={`bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] p-5`}>
            <div className={`h-5 w-3/4 ${S} rounded mb-2`} />
            {i % 2 === 0 && <div className={`h-4 w-full ${S} rounded`} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ABOUT / CONTACT / POLICY PAGES (text-heavy)
════════════════════════════════════════════════════════ */
export function ContentPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-12">
      {/* Hero banner */}
      <div className={`w-full h-48 md:h-64 ${S} rounded-tr-3xl rounded-bl-3xl mb-12`} />
      <div className="max-w-4xl mx-auto space-y-5">
        <div className={`h-9 w-1/2 ${S} rounded-xl`} />
        <div className={`h-4 w-full ${S} rounded`} />
        <div className={`h-4 w-5/6 ${S} rounded`} />
        <div className={`h-4 w-4/5 ${S} rounded`} />
        <div className={`h-4 w-full ${S} rounded`} />
        <div className={`h-6 w-1/3 ${S} rounded-xl mt-8`} />
        <div className={`h-4 w-full ${S} rounded`} />
        <div className={`h-4 w-3/4 ${S} rounded`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[1,2,3,4].map(i => <div key={i} className={`h-28 ${S} rounded-tr-2xl rounded-bl-2xl`} />)}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TRACK ORDER PAGE
════════════════════════════════════════════════════════ */
export function TrackOrderSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-12">
      <div className={`h-9 w-48 ${S} rounded-xl mb-8`} />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`h-12 w-full ${S} rounded-tr-xl rounded-bl-xl`} />
        <div className={`h-12 w-48 ${S} rounded-tr-xl rounded-bl-xl`} />
        {/* Timeline */}
        <div className="space-y-4 mt-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full ${S} flex-shrink-0`} />
              <div className="flex-1 space-y-2 pt-1">
                <div className={`h-4 w-40 ${S} rounded`} />
                <div className={`h-3 w-56 ${S} rounded`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE
════════════════════════════════════════════════════════ */
export function NotificationsSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-10">
      <div className={`h-8 w-40 ${S} rounded-xl mb-8`} />
      <div className="space-y-3 max-w-2xl">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`flex gap-4 bg-[#f5e8d4] p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)]`}>
            <div className={`w-10 h-10 rounded-full ${S} flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 ${S} rounded`} />
              <div className={`h-3 w-1/2 ${S} rounded`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CHECKOUT PAGE
════════════════════════════════════════════════════════ */
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA] px-4 md:px-8 lg:px-16 py-10">
      <div className={`h-8 w-32 ${S} rounded-xl mb-8`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {[1,2].map(i => (
            <div key={i} className={`bg-[#f5e8d4] p-6 rounded-tr-3xl rounded-bl-3xl border border-[rgba(52,21,15,0.08)] space-y-4`}>
              <div className={`h-6 w-40 ${S} rounded-xl`} />
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(j => <div key={j} className={`h-11 ${S} rounded-tr-xl rounded-bl-xl`} />)}
              </div>
            </div>
          ))}
        </div>
        <div className={`bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 border border-[rgba(52,21,15,0.08)] h-fit space-y-4`}>
          <div className={`h-6 w-32 ${S} rounded-xl`} />
          {[1,2,3].map(i => (
            <div key={i} className="flex justify-between">
              <div className={`h-4 w-24 ${S} rounded`} />
              <div className={`h-4 w-16 ${S} rounded`} />
            </div>
          ))}
          <div className={`h-12 w-full ${S} rounded-tr-2xl rounded-bl-2xl mt-4`} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CATEGORIES CATALOG PAGE (HUB & SPECIALISED LINES)
════════════════════════════════════════════════════════ */
export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/8 animate-pulse space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 rounded-tr-xl rounded-bl-xl bg-[#34150F]/10" />
          <div className="w-20 h-5 bg-[#34150F]/10 rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-[#34150F]/15 rounded-lg mb-2" />
        <div className="h-4 w-full bg-[#34150F]/10 rounded mb-1" />
        <div className="h-4 w-2/3 bg-[#34150F]/10 rounded" />
      </div>
      <div className="h-4 w-28 bg-[#D39858]/30 rounded-lg mt-4 pt-2" />
    </div>
  );
}

export function CategoriesCatalogSkeleton() {
  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-6 sm:py-10 px-3 sm:px-6 md:px-8 lg:px-16 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header Shimmer */}
        <div className="space-y-3">
          <div className="h-6 w-44 bg-[#D39858]/20 rounded-full animate-pulse" />
          <div className="h-10 w-80 bg-[#34150F]/15 rounded-xl animate-pulse" />
          <div className="h-4 w-full max-w-xl bg-[#85431E]/15 rounded-lg animate-pulse" />
        </div>

        {/* Categories Section Shimmer */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-48 bg-[#34150F]/15 rounded-lg animate-pulse" />
            <div className="h-4 w-28 bg-[#85431E]/15 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Specialised Product Lines Section Shimmer */}
        <div className="bg-white rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 shadow-sm border border-[#34150F]/8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-7 w-60 bg-[#34150F]/15 rounded-xl animate-pulse" />
              <div className="h-3.5 w-72 bg-[#85431E]/15 rounded animate-pulse" />
            </div>
            <div className="h-7 w-28 bg-[#EACEAA]/40 rounded-tr-lg rounded-bl-lg animate-pulse" />
          </div>

          {/* Chips Shimmer */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-8 w-28 bg-[#EACEAA]/50 rounded-tr-xl rounded-bl-xl animate-pulse" />
            ))}
          </div>

          {/* Product Grid Shimmer */}
          <div className="pt-2">
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
