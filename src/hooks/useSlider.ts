import { useState, useEffect, useRef, useCallback } from "react";

export function useSlider(length: number, auto = true, interval = 4000) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIdx((i) => (i + 1) % length), [length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + length) % length), [length]);

  useEffect(() => {
    if (!auto || length <= 1) return;
    timer.current = setInterval(next, interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [next, auto, interval, length]);

  return { idx, next, prev, setIdx };
}
