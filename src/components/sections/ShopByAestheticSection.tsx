import { AESTHETIC_SECTION_1 } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useInView } from "../../hooks/useInView";

interface ShopByAestheticSectionProps {
  onSelectCategory?: (title: string) => void;
}

export function ShopByAestheticSection({ onSelectCategory }: ShopByAestheticSectionProps) {
  const { ref: headerRef, visible: headerVisible } = useInView({ threshold: 0.2 });

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 overflow-hidden">
      {/* Header */}
      <div
        ref={headerRef}
        className={`transition-all duration-700 ease-out transform mb-8 ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <h2
          className="text-xl sm:text-2xl md:text-3xl font-bold text-[#34150F]"
          style={{ fontFamily: "'Gilda Display', serif" }}
        >
          Shop by Aesthetic
        </h2>
      </div>

      {/* Clean 3-Card Grid without image borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AESTHETIC_SECTION_1.map((item, i) => (
          <AestheticGridCard
            key={item.id}
            item={item}
            index={i}
            onSelectCategory={onSelectCategory}
          />
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

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 120}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      }`}
    >
      <div
        className="relative overflow-hidden rounded-tr-3xl rounded-bl-3xl group cursor-pointer shadow-md hover:shadow-xl h-[280px] md:h-[320px] w-full"
        onClick={() => onSelectCategory && onSelectCategory(item.title)}
      >
        {/* Image without any border */}
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/80 via-[#34150F]/20 to-transparent z-10" />

        {/* Content Overlay */}
        <div className="relative z-20 h-full flex flex-col justify-end p-6">
          <h3
            className="text-[#EACEAA] text-xl font-bold mb-3 drop-shadow-md"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {item.title}
          </h3>
          <button
            type="button"
            className="self-start bg-[#EACEAA] text-[#34150F] text-sm font-semibold px-5 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-colors shadow-md"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
