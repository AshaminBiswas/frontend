/* ─────────────────────────────────────────────────────────────────────────────
   Skeletons.tsx — Clean minimal loader fallbacks (No skeleton shimmers)
───────────────────────────────────────────────────────────────────────────── */

function SpinnerLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-[#85431E]">{label}</span>
    </div>
  );
}

export { HomePageSkeleton, ProductCardSkeleton, ProductSectionSkeleton } from "./PageSkeleton";

export function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden w-full bg-[#240c07] min-h-[175px] xs:min-h-[210px] sm:min-h-[260px] md:min-h-0 md:aspect-[1024/383] animate-shimmer">
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 xs:pb-8 sm:pb-10 md:justify-center md:pb-0 px-4 sm:px-8 md:px-12 lg:px-16 space-y-2 sm:space-y-3 max-w-lg pointer-events-none">
        <div className="h-4 sm:h-5 w-24 sm:w-28 bg-[#D39858]/30 rounded-full" />
        <div className="space-y-1.5 sm:space-y-2">
          <div className="h-6 xs:h-7 sm:h-8 md:h-10 w-4/5 bg-[#EACEAA]/20 rounded-lg" />
          <div className="h-4 xs:h-5 sm:h-6 md:h-7 w-1/2 bg-[#EACEAA]/15 rounded-lg" />
        </div>
        <div className="pt-1.5 sm:pt-2">
          <div className="h-8 sm:h-10 w-32 sm:w-40 bg-[#D39858]/35 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl" />
        </div>
      </div>
    </section>
  );
}

export function UpcomingSkeleton() {
  return (
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
  );
}

export function AestheticBannerSkeleton() {
  return (
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
  );
}

export function ProductSliderSkeleton({ title }: { title?: string }) {
  return (
    <div className="py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-8 lg:px-16 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#85431E]/10" />
          {title ? (
            <h2 className="text-base sm:text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              {title}
            </h2>
          ) : (
            <div className="h-5 sm:h-7 w-44 sm:w-60 bg-[#34150F]/15 rounded-lg animate-shimmer" />
          )}
        </div>
        <div className="h-6 sm:h-8 w-14 sm:w-28 rounded-full bg-[#85431E]/10" />
      </div>
      <div className="flex gap-2 sm:gap-5 overflow-hidden py-1 sm:py-2 px-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[145px] xs:w-[160px] sm:w-[260px] md:w-[300px] lg:w-[calc(25%-15px)] bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-1.5 sm:p-3 border border-[rgba(52,21,15,0.08)] shadow-2xs space-y-2 animate-shimmer">
            <div className="w-full aspect-square bg-[#34150F]/10 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl" />
            <div className="h-3 sm:h-4 w-4/5 bg-[#34150F]/15 rounded" />
            <div className="h-2.5 sm:h-3 w-1/2 bg-[#34150F]/10 rounded" />
            <div className="h-3.5 sm:h-4 w-12 sm:w-16 bg-[#34150F]/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialSkeleton() {
  return (
    <section className="py-6 sm:py-10 md:py-12 px-3 sm:px-6 md:px-8 lg:px-16 bg-[#34150F] overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="h-5 sm:h-7 w-36 sm:w-48 bg-[#EACEAA]/20 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#85431E]/20 border border-[#EACEAA]/10 rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl p-3.5 sm:p-6 space-y-2.5 animate-shimmer"
          >
            <div className="h-2.5 sm:h-3 w-full bg-[#EACEAA]/15 rounded" />
            <div className="h-2.5 sm:h-3 w-4/5 bg-[#EACEAA]/15 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FaqPageSkeleton() {
  return <SpinnerLoader label="Loading FAQs..." />;
}

export function ContentPageSkeleton() {
  return <SpinnerLoader label="Loading page..." />;
}

export function TrackOrderSkeleton() {
  return <SpinnerLoader label="Loading tracking details..." />;
}

export function NotificationsSkeleton() {
  return <SpinnerLoader label="Loading notifications..." />;
}

export function CheckoutSkeleton() {
  return <SpinnerLoader label="Loading checkout..." />;
}

export function CategoryCardSkeleton() {
  return null;
}

export function CategoriesCatalogSkeleton() {
  return <SpinnerLoader label="Loading categories..." />;
}
