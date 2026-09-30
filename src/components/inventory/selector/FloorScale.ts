'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Drawing scale of a metre-based SVG, measured: px per metre of its viewBox
 * width. Null before the first measurement and while the drawing is not laid
 * out (display: none). Type in the elevation and the floor plan is set in
 * metres so each scales as one drawing; `atLeast` keeps a caption from
 * dropping below a legible on-screen size when the drawing gets small.
 */
export function useDrawingScale(viewWidth: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [k, setK] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setK(width > 0 ? width / viewWidth : null);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewWidth]);
  /** `metres`, or more if that would render under `px` on screen. */
  const atLeast = (metres: number, px: number) => (k ? Math.max(metres, px / k) : metres);
  return { ref, k, atLeast };
}
