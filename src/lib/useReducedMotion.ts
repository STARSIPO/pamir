'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * `prefers-reduced-motion` as a subscribed external store.
 *
 * Read during render rather than written into state from an effect: static
 * export ships one HTML document to everyone, so the preference can only be
 * resolved at runtime, and resolving it via `useEffect` + `setState` costs an
 * extra render pass on every animated node (and trips
 * `react-hooks/set-state-in-effect`).
 *
 * The server snapshot is `false` — motion allowed. Reduced-motion users are
 * still covered on first paint by the `@media (prefers-reduced-motion: reduce)`
 * block in globals.css, which needs no JS.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
