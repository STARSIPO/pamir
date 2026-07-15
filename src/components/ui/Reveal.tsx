'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll-in reveal built on CSS transitions (not framer's whileInView, which
 * proved unreliable for on-mount-visible elements during SSR hydration).
 *
 * Fail-safe by design: the default state is VISIBLE. JS only *adds* a hidden
 * start state for below-the-fold elements, then transitions them in on scroll.
 * If JS never runs, content simply shows — it can never get stuck invisible.
 */
type State = 'init' | 'hidden' | 'shown';

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('init');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('shown');
      return;
    }

    const rect = el.getBoundingClientRect();
    // Already in view at mount → show immediately (no hidden detour), so
    // above-the-fold content is never gated on an animation frame firing.
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState('shown');
      return;
    }

    // Below the fold → hide, then reveal when scrolled into view.
    setState('hidden');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState('shown');
            if (once) io.disconnect();
          } else if (!once) {
            setState('hidden');
          }
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const style: CSSProperties = {
    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
    ...(state === 'hidden' && { opacity: 0, transform: `translateY(${y}px)` }),
    ...(state === 'shown' && { opacity: 1, transform: 'translateY(0)' }),
  };

  return (
    <div ref={ref} className={cn('will-change-[opacity,transform]', className)} style={style}>
      {children}
    </div>
  );
}
