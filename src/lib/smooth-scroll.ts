import type Lenis from 'lenis';

/**
 * Handle to the page's Lenis instance, so overlays (mobile menu, dialogs) can
 * pause smooth scrolling while they hold focus: `getLenis()?.stop()` on open,
 * `getLenis()?.start()` on close. Null on touch devices, under reduced motion,
 * and before hydration — callers must treat it as optional.
 */
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Lock/unlock page scroll for an overlay, with or without Lenis. */
export function lockScroll(locked: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  if (locked) instance?.stop();
  else instance?.start();
}
