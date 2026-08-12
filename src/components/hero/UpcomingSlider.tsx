import { ChevronLeft, ChevronRight } from "lucide-react";
import { UPCOMING_SLIDES } from "../../data/products";
import { useSlider } from "../../hooks/useSlider";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function UpcomingSlider() {
  const upcoming = useSlider(UPCOMING_SLIDES.length, true, 5000);

  return (
    <section className="py-10 px-4 md:px-8 lg:px-16">
      {/* Header bar with badge and navigation arrows */}
      <div className="flex items-center gap-3 mb-5">
        <div className="inline-flex items-center gap-2 bg-[#85431E] text-[#EACEAA] text-xs font-bold px-3.5 py-1.5 rounded-tr-lg rounded-bl-lg uppercase tracking-wider shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EACEAA] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EACEAA]" />
          </span>
          <span>Upcoming</span>
        </div>

        <div className="h-px flex-1 bg-[#34150F]/15" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={upcoming.prev}
            aria-label="Previous upcoming item"
            className="w-9 h-9 border border-[#85431E] rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#85431E] hover:bg-[#85431E] hover:text-[#EACEAA] transition-all duration-200 hover:scale-110 active:scale-90 shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={upcoming.next}
            aria-label="Next upcoming item"
            className="w-9 h-9 border border-[#85431E] rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#85431E] hover:bg-[#85431E] hover:text-[#EACEAA] transition-all duration-200 hover:scale-110 active:scale-90 shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Main Banner Slide Container */}
      <div className="relative overflow-hidden rounded-tr-3xl rounded-bl-3xl shadow-lg h-[220px] sm:h-[280px] md:h-[340px] w-full group bg-[#34150F]">
        {UPCOMING_SLIDES.map((slide, i) => {
          const isActive = i === upcoming.idx;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out transform ${
                isActive ? "opacity-100 scale-100 z-0" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <ImageWithFallback
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/90 via-[#34150F]/50 to-transparent z-10" />

              {/* Animated Text Content */}
              <div className="absolute inset-0 z-20 flex flex-col justify-center pl-4 sm:pl-6 md:pl-16 pr-4 sm:pr-6 max-w-xl">
                {isActive && (
                  <div key={`upcoming-text-${upcoming.idx}`} className="space-y-2">
                    <div className="inline-flex items-center text-[#D39858] text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-500">
                      <span>{slide.sub}</span>
                    </div>

                    <h3
                      className="text-[#EACEAA] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-md animate-in fade-in slide-in-from-left-6 duration-700 delay-100"
                      style={{ fontFamily: "'Gilda Display', serif" }}
                    >
                      {slide.title}
                    </h3>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Slide Dots Indicator — Bottom Right */}
        <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
          {UPCOMING_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => upcoming.setIdx(i)}
              aria-label={`Go to upcoming item ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === upcoming.idx ? "w-6 bg-[#D39858]" : "w-2 bg-[#EACEAA]/40 hover:bg-[#EACEAA]/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
