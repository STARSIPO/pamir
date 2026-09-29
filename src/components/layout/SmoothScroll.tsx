'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { getLenis, setLenis } from '@/lib/smooth-scroll';

/**
 * Inertial wheel scrolling (Lenis). Native scroll position is kept, so sticky
 * elements, IntersectionObserver reveals and CSS scroll-driven animations all
 * keep working. Touch devices keep their native scroll (Lenis' default), and
 * reduced motion turns the whole thing off.
 */
export function SmoothScroll() {
  const reduce = usePrefersReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.9,
      anchors: { offset: -80 },
      autoRaf: true,
    });
    setLenis(lenis);
    return () => {
      lenis.destroy();
      setLenis(null);
    };
  }, [reduce]);

  // Client navigation: land at the top without an animated trip there.
  useEffect(() => {
    if (window.location.hash) return;
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
