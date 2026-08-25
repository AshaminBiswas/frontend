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

export function HeroSkeleton() {
  return null;
}

export function UpcomingSkeleton() {
  return null;
}

export function ProductCardSkeleton() {
  return null;
}

export function ProductGridSkeleton({ count = 8, label = "Loading products..." }: { count?: number; label?: string }) {
  return <SpinnerLoader label={label} />;
}

export function ProductSliderSkeleton({ title }: { title?: string }) {
  return null;
}

export function ProductDetailSkeleton() {
  return <SpinnerLoader label="Loading product details..." />;
}

export function CategoryPageSkeleton() {
  return <SpinnerLoader label="Loading category products..." />;
}

export function ProductListPageSkeleton() {
  return <SpinnerLoader label="Loading products..." />;
}

export function WishlistSkeleton() {
  return <SpinnerLoader label="Loading wishlist..." />;
}

export function CartPageSkeleton() {
  return <SpinnerLoader label="Loading cart..." />;
}

export function AestheticBannerSkeleton() {
  return null;
}

export function TestimonialSkeleton() {
  return null;
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
