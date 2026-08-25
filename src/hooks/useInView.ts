import { useState, useEffect, useRef } from "react";

export interface UseInViewOptions extends IntersectionObserverInit {
  once?: boolean;
}

export function useInView(options?: UseInViewOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scrollDir, setScrollDir] = useState<"down" | "up">("down");
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 3) {
        setScrollDir("down");
      } else if (currentScrollY < lastScrollY.current - 3) {
        setScrollDir("up");
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { once = false, ...observerOpts } = options || {};

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) {
            obs.disconnect();
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.1, ...observerOpts }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, visible, scrollDir };
}
