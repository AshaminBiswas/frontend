import { Product } from "../types";
import { HeroSlider } from "../components/hero/HeroSlider";
import { UpcomingSlider } from "../components/hero/UpcomingSlider";
import { ShopByAestheticSection } from "../components/sections/ShopByAestheticSection";
import { SuperSaverSection } from "../components/sections/SuperSaverSection";
import { CubicleHardwareSection } from "../components/sections/CubicleHardwareSection";
import { ValueMoneySection } from "../components/sections/ValueMoneySection";
import { LockerHardwareSection } from "../components/sections/LockerHardwareSection";
import { BestSellerSection } from "../components/sections/BestSellerSection";
import { TrustedProjectsSection } from "../components/sections/TrustedProjectsSection";
import { TestimonialSection } from "../components/sections/TestimonialSection";

interface HomePageProps {
  onAddToCart: (p: Product) => void;
  onWishlist: (productOrId: Product | number | string) => void;
  wishlist: Set<number | string>;
  onSelectCategory: (cat: string) => void;
}

export function HomePage({ onAddToCart, onWishlist, wishlist, onSelectCategory }: HomePageProps) {
  return (
    <>
      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. Upcoming Slider */}
      <UpcomingSlider />

      {/* 3. Shop by Aesthetic */}
      <ShopByAestheticSection onSelectCategory={onSelectCategory} />

      {/* 4. Super Saver Offers */}
      <div className="bg-[#34150F]/8 py-2">
        <SuperSaverSection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 5. Cubicle Hardware Collection */}
      <CubicleHardwareSection onSelectCategory={onSelectCategory} />

      {/* 6. Value for Money */}
      <div className="bg-[#34150F]/8 py-2">
        <ValueMoneySection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 7. Locker Hardware Collection */}
      <LockerHardwareSection onSelectCategory={onSelectCategory} />

      {/* 8. Best Sellers */}
      <div className="bg-[#34150F]/8 py-2">
        <BestSellerSection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 9. Trusted Landmark Clients & Completed Projects */}
      <TrustedProjectsSection />

      {/* 10. Testimonials */}
      <TestimonialSection />
    </>
  );
}
