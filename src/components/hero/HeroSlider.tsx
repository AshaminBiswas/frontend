import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { HERO_SLIDES } from "../../data/products";
import { useSlider } from "../../hooks/useSlider";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function HeroSlider() {
  const hero = useSlider(HERO_SLIDES.length, true, 5000);
  const [progress, setProgress] = useState(0);

  // Smooth slide timer progress animation
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setProgress(pct);
    }, 50);

    return () => clearInterval(interval);
  }, [hero.idx]);

  return (
    <section className="relative overflow-hidden w-full h-[calc(100dvh-60px)] md:h-[calc(100dvh-108px)] min-h-[460px] bg-[#34150F] group">
      {/* Background Slides with Ken Burns Scale Zoom */}
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-out transform ${
            i === hero.idx
              ? "opacity-100 scale-105 z-0"
              : "opacity-0 scale-100 pointer-events-none"
          }`}
        >
          <ImageWithFallback src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          {/* Subtle text legibility shadow overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#34150F]/75 via-[#34150F]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#34150F]/30 via-transparent to-[#34150F]/20" />
        </div>
      ))}

      {/* Live Slide Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-[#34150F]/40">
        <div
          className="h-full bg-gradient-to-r from-[#D39858] to-[#EACEAA] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero Content Overlay Card */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-14 sm:pb-12 md:justify-center md:pb-0 px-4 sm:px-6 md:px-12 lg:px-20">
        <div key={`content-${hero.idx}`} className="space-y-3 sm:space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#34150F]/60 border border-[#D39858]/40 px-3 py-1.5 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-left-6 duration-500 shadow-sm">
            <span className="text-[#D39858] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              {HERO_SLIDES[hero.idx].subtitle}
            </span>
          </div>

          <h1
            className="text-[#EACEAA] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {HERO_SLIDES[hero.idx].title}
          </h1>

          <div className="pt-1 sm:pt-2 animate-in fade-in zoom-in-95 duration-700 delay-200">
            <button
              type="button"
              className="group/btn relative inline-flex items-center gap-2 sm:gap-3 bg-[#D39858] hover:bg-[#EACEAA] text-[#34150F] font-extrabold px-5 sm:px-8 py-3 sm:py-4 rounded-tr-3xl rounded-bl-3xl shadow-2xl transition-all duration-300 text-xs sm:text-sm md:text-base hover:scale-105 active:scale-95 border border-[#EACEAA]/30"
            >
              <span>Explore Collection</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover/btn:translate-x-1.5"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Glassmorphic Slide Number Badge & Controls — Bottom Right */}
      <div className="absolute bottom-4 sm:bottom-8 right-3 sm:right-6 md:right-12 z-20 flex items-center gap-2 sm:gap-4 bg-[#34150F]/60 backdrop-blur-md p-2 sm:p-2.5 px-3 sm:px-4 rounded-tr-2xl rounded-bl-2xl border border-[#EACEAA]/15 shadow-2xl">
        <span className="hidden xs:block text-xs font-bold text-[#EACEAA]/70 tracking-widest font-mono">
          0{hero.idx + 1} / 0{HERO_SLIDES.length}
        </span>

        <div className="hidden xs:block h-4 w-px bg-[#EACEAA]/20" />

        <div className="flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={hero.prev}
            aria-label="Previous slide"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-[#EACEAA]/10 hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={hero.next}
            aria-label="Next slide"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-[#EACEAA]/10 hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
