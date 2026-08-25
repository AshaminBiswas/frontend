import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Quote, User } from "lucide-react";
import { TESTIMONIALS } from "../../data/products";
import { Reveal } from "../common/Reveal";

/** Self-contained avatar that never breaks layout — falls back to initials */
function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md";
}) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-14 h-14 text-sm";
  const radius = size === "sm" ? "rounded-tr-lg rounded-bl-lg" : "rounded-tr-xl rounded-bl-xl";
  const border = size === "sm" ? "border border-[#D39858]/40" : "border-2 border-[#D39858]";

  if (!src || errored) {
    return (
      <div
        className={`${dim} ${radius} ${border} flex-shrink-0 bg-gradient-to-br from-[#D39858] to-[#85431E] flex items-center justify-center shadow-md`}
      >
        {initials ? (
          <span className="font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            {initials}
          </span>
        ) : (
          <User size={size === "sm" ? 14 : 20} className="text-[#34150F]" />
        )}
      </div>
    );
  }

  return (
    <div className={`${dim} ${radius} ${border} flex-shrink-0 overflow-hidden shadow-md`}>
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function StarRatingInline({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#D39858" : "none"}
          stroke="#D39858"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialSection() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<"left" | "right">("right");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = TESTIMONIALS.length;

  const goTo = useCallback(
    (next: number, direction: "left" | "right") => {
      if (animating) return;
      setDir(direction);
      setAnimating(true);
      setTimeout(() => {
        setActive(next);
        setAnimating(false);
      }, 320);
    },
    [animating]
  );

  const next = useCallback(() => goTo((active + 1) % total, "right"), [active, total, goTo]);
  const prev = useCallback(() => goTo((active - 1 + total) % total, "left"), [active, total, goTo]);

  useEffect(() => {
    timerRef.current = setTimeout(next, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, next]);

  const t = TESTIMONIALS[active];
  const slideClass = animating
    ? dir === "right"
      ? "opacity-0 translate-x-6"
      : "opacity-0 -translate-x-6"
    : "opacity-100 translate-x-0";
  return (
    <section className="bg-[#34150F] py-6 sm:py-10 md:py-14 px-3 sm:px-6 md:px-8 lg:px-16 overflow-hidden">
      <Reveal>
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            <span className="text-[#D39858] text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1">
              Client Stories
            </span>
            <h2
              className="text-lg sm:text-2xl md:text-3xl font-bold text-[#EACEAA]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Architect &amp; Client Feedback
            </h2>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-8 h-8 sm:w-10 sm:h-10 border border-[#D39858]/50 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center text-[#D39858] hover:bg-[#D39858] hover:text-[#34150F] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D39858] rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center text-[#34150F] hover:bg-[#EACEAA] transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Reveal>

      <div className="max-w-5xl mx-auto">
        {/* Main featured card */}
        <div
          className={`transition-all duration-300 ease-in-out ${slideClass}`}
          style={{ willChange: "opacity, transform" }}
        >
          <div className="relative bg-[#85431E]/20 border border-[#EACEAA]/10 rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl p-4 sm:p-6 md:p-10 shadow-xl">
            {/* Decorative quote */}
            <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
              <Quote size={52} className="text-[#D39858]" fill="currentColor" />
            </div>

            {/* Stars */}
            <div className="mb-3 sm:mb-5">
              <StarRatingInline rating={t.rating} />
            </div>

            {/* Quote */}
            <blockquote
              className="text-[#EACEAA] text-xs sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6 font-medium relative z-10"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              &ldquo;{t.message}&rdquo;
            </blockquote>

            {/* Author row */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                <Avatar src={t.avatar} name={t.name} size="md" />
                {/* Verified tick */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D39858] rounded-full flex items-center justify-center shadow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[#EACEAA] font-bold text-base truncate"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  {t.name}
                </p>
                <p className="text-[#D39858] text-sm font-medium truncate">{t.role}</p>
              </div>

              {/* Dot indicators */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i, i > active ? "right" : "left")}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`transition-all duration-300 rounded-full ${
                      i === active
                        ? "w-6 h-2.5 bg-[#D39858]"
                        : "w-2.5 h-2.5 bg-[#EACEAA]/25 hover:bg-[#EACEAA]/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview strip — desktop only */}
        <div className="hidden md:grid grid-cols-3 gap-4 mt-6">
          {TESTIMONIALS.map((testimonial, i) => {
            const isActive = i === active;
            return (
              <button
                key={testimonial.id}
                type="button"
                onClick={() => goTo(i, i > active ? "right" : "left")}
                className={`text-left p-5 rounded-tr-2xl rounded-bl-2xl border transition-all duration-300 ${
                  isActive
                    ? "bg-[#85431E]/30 border-[#D39858]/50 shadow-lg scale-100 opacity-100"
                    : "bg-[#85431E]/10 border-[#EACEAA]/6 hover:border-[#EACEAA]/20 hover:bg-[#85431E]/15 scale-95 opacity-55 hover:opacity-80"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={testimonial.avatar} name={testimonial.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#EACEAA] font-bold text-xs truncate">{testimonial.name}</p>
                    <p className="text-[#D39858] text-[10px] truncate">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[#EACEAA]/65 text-xs leading-relaxed line-clamp-2">
                  &ldquo;{testimonial.message}&rdquo;
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
