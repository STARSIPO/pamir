'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

/**
 * Scroll-in reveal built on CSS transitions (not framer's whileInView, which
 * proved unreliable for on-mount-visible elements during SSR hydration).
 *
 * Fail-safe by design: the default state is VISIBLE. JS only *adds* a hidden
 * start state for below-the-fold elements, then transitions them in on scroll.
 * If JS never runs, content simply shows — it can never get stuck invisible.
 *
 * Visibility is decided from the IntersectionObserver's first callback rather
 * than a mount-time getBoundingClientRect(): the rect read forced a synchronous
 * layout per instance during hydration, and there are ~60 instances.
 */
type State = 'init' | 'hidden' | 'shown';

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
  stagger = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
  /**
   * Reveal `.word` children individually instead of fading the block.
   * The wrapper only publishes `data-reveal`; the ladder lives in globals.css
   * so no per-word JS or style object is created.
   */
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('init');
  // will-change is a hint that costs a compositor layer for as long as it is
  // set, so it is scoped to the animation instead of living on the wrapper.
  const [animating, setAnimating] = useState(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    // Reduced motion keeps the element in 'init' — visible, untransformed, and
    // with no transition to run.
    if (!el || reduce) return;

    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Already in view on the first callback → show immediately, with no
            // hidden detour, so above-the-fold content never animates in late.
            if (!first) setAnimating(true);
            setState('shown');
            if (once) io.disconnect();
          } else if (first) {
            setState('hidden');
          } else if (!once) {
            setState('hidden');
          }
        }
        first = false;
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, reduce]);

  const style: CSSProperties = stagger
    ? {}
    : {
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        ...(animating || state === 'hidden' ? { willChange: 'opacity, transform' } : null),
        ...(state === 'hidden' && { opacity: 0, transform: `translateY(${y}px)` }),
        ...(state === 'shown' && { opacity: 1, transform: 'translateY(0)' }),
      };

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      // 'init' publishes no attribute at all, so words stay visible when JS
      // never runs or reduced motion short-circuits the observer.
      data-reveal={stagger && state !== 'init' ? state : undefined}
      onTransitionEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}
