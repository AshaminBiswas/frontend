import { AestheticBannerItem } from "../../types";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useInView } from "../../hooks/useInView";

interface AestheticBannerRowProps {
  title: string;
  items: AestheticBannerItem[];
  onSelectCategory?: (title: string) => void;
}

function AestheticCard({
  item,
  index,
  onSelectCategory,
}: {
  item: AestheticBannerItem;
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
        className="relative overflow-hidden rounded-tr-3xl rounded-bl-3xl group cursor-pointer shadow-lg hover:shadow-2xl h-[280px] md:h-[320px] w-full bg-[#34150F]"
        onClick={() => onSelectCategory && onSelectCategory(item.title)}
      >
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/90 via-[#34150F]/30 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-95" />
        <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-8">
          <h3
            className="text-[#EACEAA] text-xl md:text-2xl font-bold mb-3 transition-transform duration-300 group-hover:-translate-y-1 drop-shadow-md"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {item.title}
          </h3>
          <button
            type="button"
            className="self-start bg-[#EACEAA] text-[#34150F] text-sm font-bold px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-all duration-300 shadow-md group-hover:scale-105 active:scale-95"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function AestheticBannerRow({ title, items, onSelectCategory }: AestheticBannerRowProps) {
  const { ref: headerRef, visible: headerVisible } = useInView({ threshold: 0.2 });

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 overflow-hidden">
      {/* Scroll-triggered Header */}
      <div
        ref={headerRef}
        className={`transition-all duration-700 ease-out transform mb-8 ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <h2
          className="text-2xl md:text-3xl font-bold text-[#34150F]"
          style={{ fontFamily: "'Gilda Display', serif" }}
        >
          {title}
        </h2>
      </div>

      {/* Scroll-triggered Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <AestheticCard key={item.id} item={item} index={i} onSelectCategory={onSelectCategory} />
        ))}
      </div>
    </section>
  );
}
