import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSlider } from "../../hooks/useSlider";
import { bannerService, Banner } from "../../services/bannerService";
import { HERO_SLIDES } from "../../data/products";

const DEFAULT_HERO_SLIDES = HERO_SLIDES.map((s) => ({
  id: String(s.id),
  title: s.title,
  subtitle: s.subtitle,
  badgeText: "PREMIUM FINISH",
  image: s.image,
  desktopImage: s.image,
  tabletImage: s.image,
  mobileImage: s.image,
  linkUrl: "/products",
  ctaText: "Explore Collection",
}));

export function HeroSlider() {
  const [slides, setSlides] = useState<Array<{
    id: string;
    title: string;
    subtitle: string;
    badgeText?: string;
    image: string;
    desktopImage?: string;
    tabletImage?: string;
    mobileImage?: string;
    linkUrl?: string;
    ctaText?: string;
  }>>(DEFAULT_HERO_SLIDES);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Responsive device viewport tracker (< 768px is mobile/small device)
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(() => {
    if (typeof window === "undefined") return "desktop";
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setViewport("mobile");
      else if (w < 1024) setViewport("tablet");
      else setViewport("desktop");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    bannerService.getPublicBanners("HERO_SLIDER").then((data) => {
      if (mounted) {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((b: Banner) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || "",
            badgeText: b.badgeText || undefined,
            image: b.desktopImage || b.image || "",
            desktopImage: b.desktopImage || b.image,
            tabletImage: b.tabletImage || undefined,
            mobileImage: b.mobileImage || undefined,
            linkUrl: b.linkUrl || b.link || "/products",
            ctaText: b.ctaText || "Explore Collection"
          }));
          setSlides(formatted);
        } else if (slides.length === 0) {
          setSlides(DEFAULT_HERO_SLIDES);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        if (slides.length === 0) setSlides(DEFAULT_HERO_SLIDES);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const hero = useSlider(slides.length, true, 5000);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<string>("1024 / 383");

  const currentSlide = slides[hero.idx] || slides[0];

  // Helper to get customized device image (mobile image for small screens < 768px)
  const getActiveImage = (slide: typeof slides[0]) => {
    if (!slide) return "";
    if (viewport === "mobile") {
      return slide.mobileImage || slide.desktopImage || slide.image || "";
    }
    if (viewport === "tablet") {
      return slide.tabletImage || slide.mobileImage || slide.desktopImage || slide.image || "";
    }
    return slide.desktopImage || slide.image || "";
  };

  // Automatically measure and apply exact aspect ratio of the active device image
  useEffect(() => {
    if (!currentSlide) return;
    const activeUrl = getActiveImage(currentSlide);
    if (!activeUrl) return;

    const testImg = new Image();
    testImg.src = activeUrl;
    if (testImg.complete && testImg.naturalWidth && testImg.naturalHeight) {
      setAspectRatio(`${testImg.naturalWidth} / ${testImg.naturalHeight}`);
    } else {
      testImg.onload = () => {
        if (testImg.naturalWidth && testImg.naturalHeight) {
          setAspectRatio(`${testImg.naturalWidth} / ${testImg.naturalHeight}`);
        }
      };
    }
  }, [currentSlide, viewport, slides]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };

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

  const handleCtaClick = () => {
    if (currentSlide?.linkUrl) {
      if (currentSlide.linkUrl.startsWith("http")) {
        window.location.href = currentSlide.linkUrl;
      } else {
        navigate(currentSlide.linkUrl);
      }
    } else {
      navigate("/products");
    }
  };

  // 1. Sleek Skeleton Shimmer Loader while fetching live database banners
  if (loading) {
    return (
      <section 
        className="relative overflow-hidden w-full bg-[#1e0a06] transition-[aspect-ratio] duration-300"
        style={{ aspectRatio }}
      >
        {/* Shimmer background animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#240c07] via-[#3d1810] to-[#240c07] animate-pulse" />
        
        {/* Top Progress Bar Placeholder */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#34150F]/50" />

        {/* Hero Content Overlay Skeleton */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 sm:pb-10 md:justify-center md:pb-0 px-4 sm:px-8 md:px-12 lg:px-16 pointer-events-none">
          <div className="space-y-3 max-w-md md:max-w-lg">
            {/* Badge Skeleton */}
            <div className="h-5 w-28 bg-[#D39858]/20 rounded-full animate-pulse" />

            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-7 sm:h-9 w-3/4 bg-[#EACEAA]/15 rounded-lg animate-pulse" />
              <div className="h-5 sm:h-7 w-1/2 bg-[#EACEAA]/10 rounded-lg animate-pulse" />
            </div>

            {/* CTA Button Skeleton */}
            <div className="pt-2">
              <div className="h-9 sm:h-10 w-36 sm:w-44 bg-[#D39858]/30 rounded-tr-2xl rounded-bl-2xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Slide Controls — Bottom Right */}
        <div className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-6 md:right-8 z-20 flex items-center gap-2 bg-[#34150F]/60 backdrop-blur-md p-1.5 px-3 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/10">
          <div className="h-3.5 w-12 bg-white/10 rounded animate-pulse" />
          <div className="h-3.5 w-px bg-white/10" />
          <div className="h-6 w-6 bg-white/10 rounded-md animate-pulse" />
          <div className="h-6 w-6 bg-white/10 rounded-md animate-pulse" />
        </div>
      </section>
    );
  }

  // 2. If no banners are active in the database, return null
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative overflow-hidden w-full bg-[#240c07] group transition-[aspect-ratio] duration-300"
      style={{ aspectRatio }}
    >
      {/* Background Slides - Full Image View */}
      {slides.map((slide, i) => {
        const imageSrc = getActiveImage(slide);
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === hero.idx
                ? "opacity-100 z-0 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              key={`${slide.id}-${viewport}`}
              src={imageSrc}
              alt={slide.title}
              onLoad={handleImageLoad}
              className="w-full h-full object-cover object-center block"
            />
            
            {/* Subtle text legibility gradient overlay (non-obstructive) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#240c07]/75 via-[#240c07]/25 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#240c07]/40 via-transparent to-transparent pointer-events-none" />
          </div>
        );
      })}

      {/* Live Slide Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-[#34150F]/40 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#D39858] to-[#EACEAA] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero Content Overlay Card */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 sm:pb-10 md:justify-center md:pb-0 px-4 sm:px-8 md:px-12 lg:px-16 pointer-events-none">
        <div key={`content-${hero.idx}`} className="space-y-1.5 sm:space-y-2.5 max-w-md md:max-w-lg pointer-events-auto">
          {(currentSlide.badgeText || currentSlide.subtitle) && (
            <div className="inline-flex items-center gap-1.5 bg-[#34150F]/80 border border-[#D39858]/40 px-2 sm:px-2.5 py-0.5 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-500 shadow-sm">
              <span className="text-[#D39858] text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em]">
                {currentSlide.badgeText || currentSlide.subtitle}
              </span>
            </div>
          )}

          {currentSlide.title && (
            <h1
              className="text-[#EACEAA] text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-[1.12] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              {currentSlide.title}
            </h1>
          )}

          <div className="pt-0.5 sm:pt-1 animate-in fade-in zoom-in-95 duration-700 delay-200">
            <button
              type="button"
              onClick={handleCtaClick}
              className="group/btn relative inline-flex items-center gap-1.5 sm:gap-2 bg-[#D39858] hover:bg-[#EACEAA] text-[#34150F] font-extrabold px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-tr-2xl sm:rounded-tr-3xl rounded-bl-2xl sm:rounded-bl-3xl shadow-lg transition-all duration-300 text-xs sm:text-sm hover:scale-105 active:scale-95 border border-[#EACEAA]/30 cursor-pointer"
            >
              <span>{currentSlide.ctaText || "Explore Collection"}</span>
              <ArrowRight
                size={13}
                className="transition-transform duration-300 group-hover/btn:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Glassmorphic Slide Controls — Bottom Right */}
      <div className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-6 md:right-8 z-20 flex items-center gap-1.5 sm:gap-2.5 bg-[#34150F]/70 backdrop-blur-md p-1 sm:p-1.5 px-2 sm:px-3 rounded-tr-xl rounded-bl-xl border border-[#EACEAA]/15 shadow-xl">
        <span className="hidden xs:block text-[10px] sm:text-xs font-bold text-[#EACEAA]/75 tracking-widest font-mono">
          0{hero.idx + 1} / 0{slides.length}
        </span>

        <div className="hidden xs:block h-3 w-px bg-[#EACEAA]/20" />

        <div className="flex gap-1">
          <button
            type="button"
            onClick={hero.prev}
            aria-label="Previous slide"
            className="w-6 h-6 sm:w-7 sm:h-7 bg-[#EACEAA]/10 hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] rounded-tr-md rounded-bl-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={hero.next}
            aria-label="Next slide"
            className="w-6 h-6 sm:w-7 sm:h-7 bg-[#EACEAA]/10 hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] rounded-tr-md rounded-bl-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
