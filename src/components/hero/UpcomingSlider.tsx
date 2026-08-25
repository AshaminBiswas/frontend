import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSlider } from "../../hooks/useSlider";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { bannerService, Banner } from "../../services/bannerService";
import { DEFAULT_UPCOMING_SLIDES } from "../../data/products";

export function UpcomingSlider() {
  const [slides, setSlides] = useState<Array<{
    id: string;
    title: string;
    sub: string;
    image: string;
    desktopImage?: string;
    mobileImage?: string;
    linkUrl?: string;
  }>>(DEFAULT_UPCOMING_SLIDES);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    bannerService.getPublicBanners("HOME_UPCOMING").then((data) => {
      if (mounted) {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((b: Banner) => ({
            id: b.id,
            title: b.title,
            sub: b.badgeText || b.subtitle || "Coming Soon",
            image: b.desktopImage || b.image || "",
            desktopImage: b.desktopImage || b.image,
            mobileImage: b.mobileImage || b.desktopImage || b.image,
            linkUrl: b.linkUrl || b.link || "/products"
          }));
          setSlides(formatted);
        } else {
          setSlides([]);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setSlides([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useSlider(slides.length, true, 5000);

  // If no upcoming slides, return null
  if (!slides || slides.length === 0) {
    return null;
  }

  // 2. Hide section if no upcoming banners exist in the database
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section className="py-4 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 lg:px-16">
      {/* Header bar with badge and navigation arrows */}
      <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
        <div className="inline-flex items-center gap-1.5 bg-[#85431E] text-[#EACEAA] text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-tr-md rounded-bl-md uppercase tracking-wider shadow-xs">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EACEAA] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#EACEAA]" />
          </span>
          <span>Upcoming</span>
        </div>

        <div className="h-px flex-1 bg-[#34150F]/15" />

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={upcoming.prev}
            aria-label="Previous upcoming banner"
            className="w-7 h-7 sm:w-9 sm:h-9 border border-[#85431E]/30 rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#85431E] hover:bg-[#85431E] hover:text-[#EACEAA] transition-colors active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={upcoming.next}
            aria-label="Next upcoming banner"
            className="w-7 h-7 sm:w-9 sm:h-9 border border-[#85431E]/30 rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#85431E] hover:bg-[#85431E] hover:text-[#EACEAA] transition-colors active:scale-95 cursor-pointer"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main Banner Slide Container */}
      <div className="relative overflow-hidden rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl shadow-lg h-[160px] sm:h-[220px] md:h-[300px] w-full group bg-[#34150F]">
        {slides.map((slide, i) => {
          const isActive = i === upcoming.idx;

          return (
            <div
              key={slide.id}
              onClick={() => slide.linkUrl && navigate(slide.linkUrl)}
              className={`absolute inset-0 transition-all duration-700 ease-out transform cursor-pointer ${
                isActive ? "opacity-100 scale-100 z-0" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <ImageWithFallback
                src={slide.desktopImage || slide.image}
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
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => upcoming.setIdx(i)}
              aria-label={`Go to upcoming item ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === upcoming.idx ? "w-6 bg-[#D39858]" : "w-2 bg-[#EACEAA]/40 hover:bg-[#EACEAA]/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
