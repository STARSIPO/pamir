'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import type { RiseState } from './ComplexDrawing';

/**
 * When the scheme's volumes rise out of the ground.
 *
 * The HTML ships with the rise already running ('play'), so a scheme that is
 * on screen at load animates from first paint, before hydration. One that
 * loads below the fold is held underground ('wait') and plays when it scrolls
 * in. Reduced motion: always 'play', which the CSS turns into "already there".
 */
export function useRise<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduce = usePrefersReducedMotion();
  const [rise, setRise] = useState<RiseState>('play');
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!first) setRise('play');
          io.disconnect();
        } else if (first) {
          setRise('wait');
        }
        first = false;
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);
  return { ref, rise: reduce ? ('play' as const) : rise };
}
