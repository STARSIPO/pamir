'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

/**
 * A number that glides to its new value (easeOutCubic) instead of jumping —
 * the calculator's totals. Reduced motion: the target, immediately.
 * State is only written from animation frames, never synchronously in the
 * effect, so a change costs one render per frame of the glide and no more.
 */
export function useTweenedNumber(target: number, duration = 700): number {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduce) {
      current.current = target;
      return;
    }
    const from = current.current;
    if (from === target) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = p === 1 ? target : from + (target - from) * eased;
      current.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);

  return reduce ? target : shown;
}

/** `value`, once it has stopped changing for `delay` ms (live-region text, analytics). */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
}

/**
 * Run `fn` once the dependencies have been quiet for `delay` ms — but only
 * after `arm()` was called (a user interaction), so page load never fires it.
 */
export function useSettledEffect(fn: () => void, deps: unknown[], delay = 800) {
  const armed = useRef(false);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (!armed.current) return;
    const t = setTimeout(() => fnRef.current(), delay);
    return () => clearTimeout(t);
    // The caller's deps are the trigger; fn is read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
  return () => {
    armed.current = true;
  };
}

const noop = () => () => {};

/** True after hydration (portals need document.body). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Whether an element intersects the viewport (null until observed). */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
