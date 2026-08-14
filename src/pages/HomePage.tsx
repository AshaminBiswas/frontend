import { lazy, Suspense } from "react";
import { Product } from "../types";
import { HeroSlider } from "../components/hero/HeroSlider";
import { UpcomingSlider } from "../components/hero/UpcomingSlider";
import {
  ProductSliderSkeleton,
  AestheticBannerSkeleton,
  TestimonialSkeleton,
} from "../components/common/Skeletons";

const ShopByAestheticSection = lazy(() =>
  import("../components/sections/ShopByAestheticSection").then((m) => ({ default: m.ShopByAestheticSection }))
);
const SuperSaverSection = lazy(() =>
  import("../components/sections/SuperSaverSection").then((m) => ({ default: m.SuperSaverSection }))
);
const CubicleHardwareSection = lazy(() =>
  import("../components/sections/CubicleHardwareSection").then((m) => ({ default: m.CubicleHardwareSection }))
);
const ValueMoneySection = lazy(() =>
  import("../components/sections/ValueMoneySection").then((m) => ({ default: m.ValueMoneySection }))
);
const LockerHardwareSection = lazy(() =>
  import("../components/sections/LockerHardwareSection").then((m) => ({ default: m.LockerHardwareSection }))
);
const BestSellerSection = lazy(() =>
  import("../components/sections/BestSellerSection").then((m) => ({ default: m.BestSellerSection }))
);
const TestimonialSection = lazy(() =>
  import("../components/sections/TestimonialSection").then((m) => ({ default: m.TestimonialSection }))
);

interface HomePageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
  onSelectCategory: (cat: string) => void;
}

export function HomePage({ onAddToCart, onWishlist, wishlist, onSelectCategory }: HomePageProps) {
  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Upcoming Slider */}
      <UpcomingSlider />

      {/* Shop by Aesthetic */}
      <Suspense fallback={<AestheticBannerSkeleton />}>
        <ShopByAestheticSection onSelectCategory={onSelectCategory} />
      </Suspense>

      {/* Super Saver Offers */}
      <div className="bg-[#34150F]/8 py-2">
        <Suspense fallback={<ProductSliderSkeleton title="Super Saver Offers" />}>
          <SuperSaverSection
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
            wishlist={wishlist}
            onViewAll={onSelectCategory}
          />
        </Suspense>
      </div>

      {/* Cubicle Hardware Collection */}
      <Suspense fallback={<AestheticBannerSkeleton />}>
        <CubicleHardwareSection onSelectCategory={onSelectCategory} />
      </Suspense>

      {/* Value for Money */}
      <div className="bg-[#34150F]/8 py-2">
        <Suspense fallback={<ProductSliderSkeleton title="Value For Money" />}>
          <ValueMoneySection
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
            wishlist={wishlist}
            onViewAll={onSelectCategory}
          />
        </Suspense>
      </div>

      {/* Locker Hardware Collection */}
      <Suspense fallback={<AestheticBannerSkeleton />}>
        <LockerHardwareSection onSelectCategory={onSelectCategory} />
      </Suspense>

      {/* Best Sellers */}
      <div className="bg-[#34150F]/8 py-2">
        <Suspense fallback={<ProductSliderSkeleton title="Best Sellers" />}>
          <BestSellerSection
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
            wishlist={wishlist}
            onViewAll={onSelectCategory}
          />
        </Suspense>
      </div>

      {/* Testimonials */}
      <Suspense fallback={<TestimonialSkeleton />}>
        <TestimonialSection />
      </Suspense>
    </>
  );
}
