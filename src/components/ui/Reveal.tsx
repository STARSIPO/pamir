'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

/**
 * Scroll-in reveal built on CSS transitions.
 *
 * Fail-safe by design: the default state is VISIBLE. JS only *adds* a hidden
 * start state for below-the-fold elements, then transitions them in on scroll.
 * If JS never runs, content simply shows — it can never get stuck invisible.
 *
 * Variants
 *  - `fade`  (default) — fade-up by `y` px. Text, rows, small blocks.
 *  - `mask`  — the frame opens from its bottom edge while the image inside
 *              settles from a slight zoom. Photos only; never the LCP image.
 *  - `stagger` — like fade, but `.word` children (see splitWords) arrive one
 *              by one. The ladder lives in globals.css.
 *
 * Visibility is decided from the IntersectionObserver's first callback: an
 * element already on screen at mount is shown immediately, with no detour
 * through the hidden state, so above-the-fold content never animates in late.
 */
type State = 'init' | 'hidden' | 'shown';

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  style: styleProp,
  once = true,
  stagger = false,
  variant = 'fade',
  as: Tag = 'div',
  threshold = 0.15,
}: {
  children: ReactNode;
  /** Seconds. Use small ladders (0.08 steps) for siblings. */
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
  stagger?: boolean;
  variant?: 'fade' | 'mask';
  as?: ElementType;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>('init');
  // will-change costs a compositor layer for as long as it is set, so it is
  // scoped to the animation instead of living on the wrapper.
  const [animating, setAnimating] = useState(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!first) setAnimating(true);
            setState('shown');
            if (once) io.disconnect();
          } else if (first || !once) {
            setState('hidden');
          }
        }
        first = false;
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, reduce, threshold]);

  let style: CSSProperties = { ...styleProp };
  let data: Record<string, string | undefined> = {};

  if (variant === 'mask') {
    data = { 'data-mask': state === 'init' ? undefined : state };
    // The clip and its transition live on the child (see globals.css), so the
    // delay travels down as a custom property.
    if (delay) style = { ...style, ['--mask-delay' as string]: `${delay}s` };
  } else if (stagger) {
    data = { 'data-reveal': state === 'init' ? undefined : state };
  } else {
    const t = `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s`;
    style = {
      ...style,
      transition: t,
      ...(animating || state === 'hidden' ? { willChange: 'opacity, transform' } : null),
      ...(state === 'hidden' && { opacity: 0, transform: `translate3d(0, ${y}px, 0)` }),
      ...(state === 'shown' && { opacity: 1, transform: 'translate3d(0, 0, 0)' }),
    };
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      {...data}
      onTransitionEnd={animating ? () => setAnimating(false) : undefined}
    >
      {children}
    </Tag>
  );
}
