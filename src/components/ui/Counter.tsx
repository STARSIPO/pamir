'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

/**
 * Count-up numeral that runs once, when the figure scrolls into view.
 *
 * Fail-safe like <Reveal>: the server HTML (and any no-JS, reduced-motion or
 * already-on-screen render) carries the FINAL value. JS only rewinds the
 * figure to 0 when it is still below the fold, then counts up as it arrives.
 *
 * No layout shift at display sizes: while counting, an invisible copy of the
 * final value holds the width and the moving digits are laid over it, so the
 * suffix, the hairlines and the label under the figure never move. Digits are
 * tabular, so 0 → 500 keeps an even rhythm.
 *
 * Screen readers get the final value only; the moving copy is aria-hidden.
 */
export function Counter({
  value,
  suffix = '',
  duration = 1600,
  locale,
  className,
  suffixClassName,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  locale?: Locale;
  className?: string;
  /** Optional styling for the suffix ("+"), e.g. a quieter colour. */
  suffixClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // null = show the final value (the default, and the end state).
  const [display, setDisplay] = useState<number | null>(null);
  const reduce = usePrefersReducedMotion();

  const format = useMemo(() => new Intl.NumberFormat(locale ?? 'ru'), [locale]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    let raf = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let first = true;

    const run = () => {
      let start: number | null = null;
      const tick = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / duration, 1);
        // easeOutExpo: fast through the small numbers, a long calm landing.
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(p === 1 ? null : Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // Safety net: land on the final value even if rAF is throttled.
      settle = setTimeout(() => setDisplay(null), duration + 400);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (first) {
            // Anywhere in the viewport at mount: keep the final value, never
            // rewind a number the reader may already be looking at.
            const onScreen = e.boundingClientRect.top < window.innerHeight && e.boundingClientRect.bottom > 0;
            if (onScreen) {
              io.disconnect();
            } else {
              setDisplay(0);
            }
          } else if (e.isIntersecting) {
            io.disconnect();
            run();
          }
        }
        first = false;
      },
      // Start once the figure is clearly inside the viewport, not at its edge.
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (settle) clearTimeout(settle);
    };
  }, [reduce, value, duration]);

  const finalText = format.format(value);
  const counting = !reduce && display !== null;
  const tail = suffix ? <span className={suffixClassName}>{suffix}</span> : null;

  return (
    <span ref={ref} className={cn('relative inline-block whitespace-nowrap tabular', className)}>
      {/* The final value: sets the width, and is what assistive tech reads. */}
      <span className={cn(counting && 'opacity-0')}>
        {finalText}
        {tail}
      </span>
      {counting && (
        <span aria-hidden="true" className="absolute left-0 top-0 select-none">
          {format.format(display)}
          {tail}
        </span>
      )}
    </span>
  );
}
