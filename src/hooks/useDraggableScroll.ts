import React, { useRef, useState, useCallback } from "react";

/**
 * Custom hook that enables fluid mouse click-and-drag horizontal scrolling
 * on desktop devices, while preserving normal touch gestures on mobile devices.
 */
export function useDraggableScroll<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || e.button !== 0) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDownRef.current || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDownRef.current = false;
    setTimeout(() => {
      setIsDragging(false);
      hasMovedRef.current = false;
    }, 50);
  }, []);

  const onMouseLeave = useCallback(() => {
    isDownRef.current = false;
    setIsDragging(false);
    hasMovedRef.current = false;
  }, []);

  const scrollBy = useCallback((offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, []);

  return {
    containerRef,
    isDragging,
    hasMoved: hasMovedRef,
    scrollBy,
    dragProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  };
}

export default useDraggableScroll;
