'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

/**
 * Animated count-up that runs once when scrolled into view.
 *
 * Uses a plain IntersectionObserver rather than framer-motion's useInView:
 * those two hooks were the library's only consumers in the codebase, and no
 * `motion.*` component is rendered anywhere, so importing them pulled a
 * dependency in for ~15 lines of platform API.
 */
export function Counter({
  value,
  suffix = '',
  duration = 1600,
  locale,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  locale?: Locale;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);
  const reduce = usePrefersReducedMotion();

  // Reduced motion is read during render, not written into state from an
  // effect, so the final number is correct on the very first paint.
  const shown = reduce ? value : display;

  const format = useMemo(() => new Intl.NumberFormat(locale ?? 'ru'), [locale]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Safety net: guarantee the final value even if rAF is throttled/interrupted.
    const settle = setTimeout(() => setDisplay(value), duration + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={className}>
      <span className="tabular">{format.format(shown)}</span>
      {suffix}
    </span>
  );
}
