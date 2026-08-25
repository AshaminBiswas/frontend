import { AESTHETIC_SECTION_1 } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useInView } from "../../hooks/useInView";

interface ShopByAestheticSectionProps {
  onSelectCategory?: (title: string) => void;
}

export function ShopByAestheticSection({ onSelectCategory }: ShopByAestheticSectionProps) {
  const { ref: headerRef, visible: headerVisible } = useInView({ threshold: 0.1 });

  return (
    <section className="py-4 sm:py-6 md:py-10 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
      {/* Header */}
      <div
        ref={headerRef}
        className={`transition-all duration-500 ease-out mb-3 sm:mb-6 ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <h2
          className="text-base sm:text-xl md:text-2xl font-bold text-[#34150F]"
          style={{ fontFamily: "'Gilda Display', serif" }}
        >
          Shop by Aesthetic
        </h2>
      </div>

      {/* Clean responsive grid: 1 column on small screens, 3 columns on tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 overflow-hidden">
        {AESTHETIC_SECTION_1.map((item, i) => (
          <div key={item.id} className="w-full overflow-hidden">
            <AestheticGridCard
              item={item}
              index={i}
              onSelectCategory={onSelectCategory}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function AestheticGridCard({
  item,
  index,
  onSelectCategory,
}: {
  item: typeof AESTHETIC_SECTION_1[0];
  index: number;
  onSelectCategory?: (title: string) => void;
}) {
  const { ref, visible } = useInView({ threshold: 0.15 });
  const isEven = index % 2 === 0;

  // On small devices (< 640px):
  // Even cards (0, 2) slide in smoothly from the left
  // Odd cards (1) slide in smoothly from the right
  const initialSlideClass = isEven
    ? "-translate-x-16 sm:translate-x-0 sm:translate-y-3"
    : "translate-x-16 sm:translate-x-0 sm:translate-y-3";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
      className={`w-full will-change-transform transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${initialSlideClass}`
      }`}
    >
      <div
        className="relative overflow-hidden rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl group cursor-pointer shadow-2xs hover:shadow-md h-[140px] sm:h-[200px] md:h-[280px] lg:h-[300px] w-full bg-[#34150F]"
        onClick={() => onSelectCategory && onSelectCategory((item as any).slug || item.title)}
      >
        {/* Image without any border */}
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/85 via-[#34150F]/20 to-transparent z-10" />

        {/* Content Overlay */}
        <div className="relative z-20 h-full flex flex-col justify-end p-3 sm:p-5">
          <h3
            className="text-[#EACEAA] text-sm sm:text-lg md:text-xl font-bold mb-1 drop-shadow-md"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {item.title}
          </h3>
          <button
            type="button"
            className="self-start bg-[#EACEAA] text-[#34150F] text-[10px] sm:text-xs font-extrabold px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-tr-md rounded-bl-md sm:rounded-tr-xl sm:rounded-bl-xl hover:bg-[#D39858] transition-colors shadow-2xs active:scale-95"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
