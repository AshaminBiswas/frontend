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
    <div className="bg-[#DBBF9E] w-full min-h-screen" style={{ backgroundColor: "#DBBF9E" }}>
      {/* 1. Hero Slider */}
      <div className="bg-[#DBBF9E]">
        <HeroSlider />
      </div>

      {/* 2. Upcoming Slider */}
      <div className="bg-[#D2B28F] border-b border-[#34150F]/10">
        <UpcomingSlider />
      </div>

      {/* 3. Shop by Aesthetic */}
      <div className="bg-[#FAF4ED] border-y border-[#34150F]/8 py-2 sm:py-4">
        <ShopByAestheticSection onSelectCategory={onSelectCategory} />
      </div>

      {/* 4. Super Saver Offers */}
      <div className="bg-[#EED5BC] border-y border-[#34150F]/8 py-3 sm:py-5">
        <SuperSaverSection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 5. Cubicle Hardware Collection */}
      <div className="bg-[#F5ECE0] border-y border-[#34150F]/8 py-2 sm:py-4">
        <CubicleHardwareSection onSelectCategory={onSelectCategory} />
      </div>

      {/* 6. Value for Money */}
      <div className="bg-[#E6CAA8] border-y border-[#34150F]/8 py-3 sm:py-5">
        <ValueMoneySection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 7. Locker Hardware Collection */}
      <div className="bg-[#F8F2EA] border-y border-[#34150F]/8 py-2 sm:py-4">
        <LockerHardwareSection onSelectCategory={onSelectCategory} />
      </div>

      {/* 8. Best Sellers */}
      <div className="bg-[#DFC19E] border-y border-[#34150F]/8 py-3 sm:py-5">
        <BestSellerSection
          onAddToCart={onAddToCart}
          onWishlist={onWishlist}
          wishlist={wishlist}
          onViewAll={onSelectCategory}
        />
      </div>

      {/* 9. Trusted Landmark Clients & Completed Projects */}
      <div className="bg-[#F2E5D5] border-y border-[#34150F]/8 py-2 sm:py-4">
        <TrustedProjectsSection />
      </div>

      {/* 10. Testimonials */}
      <div className="bg-[#EED5BC] border-y border-[#34150F]/8 py-2 sm:py-4">
        <TestimonialSection />
      </div>
    </div>
  );
}
