"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

const MAX_CANVAS_PIXELS = 2400;

// Canvas pixel size = CSS size x device pixel ratio, so lines stay sharp on any screen
export const useCanvasPixelSize = (containerRef: RefObject<HTMLElement | null>): number => {
  const [pixelSize, setPixelSize] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setPixelSize(Math.min(MAX_CANVAS_PIXELS, Math.round(width * window.devicePixelRatio)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return pixelSize;
};