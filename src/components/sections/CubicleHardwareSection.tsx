import { CUBICLE_SECTION } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useInView } from "../../hooks/useInView";

interface CubicleHardwareSectionProps {
  onSelectCategory?: (title: string) => void;
}

export function CubicleHardwareSection({ onSelectCategory }: CubicleHardwareSectionProps) {
  const { ref: headerRef, visible: headerVisible } = useInView({ threshold: 0.2 });

  return (
    <section className="py-4 sm:py-6 md:py-10 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
      {/* Scroll-triggered Header */}
      <div
        ref={headerRef}
        className={`transition-all duration-700 ease-out transform mb-3 sm:mb-6 ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <h2
          className="text-base sm:text-xl md:text-2xl font-bold text-[#34150F]"
          style={{ fontFamily: "'Gilda Display', serif" }}
        >
          Cubicle Hardware Collection
        </h2>
      </div>

      {/* Scroll-triggered Card Grid */}
      <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-6 overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory -mx-3 px-3 md:mx-0 md:px-0 pb-1">
        {CUBICLE_SECTION.map((item, i) => (
          <div key={item.id} className="w-[220px] xs:w-[260px] md:w-auto shrink-0 md:shrink snap-start">
            <CubicleCard item={item} index={i} onSelectCategory={onSelectCategory} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CubicleCard({
  item,
  index,
  onSelectCategory,
}: {
  item: typeof CUBICLE_SECTION[0];
  index: number;
  onSelectCategory?: (title: string) => void;
}) {
  const { ref, visible } = useInView({ threshold: 0.15 });

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 150}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-14 scale-95"
      }`}
    >
      <div
        className="relative overflow-hidden rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl group cursor-pointer shadow-sm hover:shadow-lg h-[160px] sm:h-[220px] md:h-[300px] w-full bg-[#34150F]"
        onClick={() => onSelectCategory && onSelectCategory((item as any).slug || item.title)}
      >
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/90 via-[#34150F]/30 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-95" />
        <div className="relative z-20 h-full flex flex-col justify-end p-3.5 sm:p-6 md:p-8">
          <h3
            className="text-[#EACEAA] text-sm sm:text-lg md:text-xl font-bold mb-1.5 transition-transform duration-300 drop-shadow-md"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {item.title}
          </h3>
          <button
            type="button"
            className="self-start bg-[#EACEAA] text-[#34150F] text-[10px] sm:text-xs font-bold px-3 py-1 sm:px-4 sm:py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl hover:bg-[#D39858] transition-all duration-300 shadow-xs active:scale-95"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
