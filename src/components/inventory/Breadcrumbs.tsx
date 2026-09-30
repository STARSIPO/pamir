'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

/** Width of the edge fade that says "the trail continues this way". */
const FADE = 'calc(var(--gutter) + 1.75rem)';

/** Alpha mask for the scroller; `black` / `transparent` are alpha stops, not colours. */
function edgeMask(start: boolean, end: boolean): string | undefined {
  if (!start && !end) return undefined;
  const from = start ? `transparent 0, black ${FADE}` : 'black 0';
  const to = end ? `black calc(100% - ${FADE}), transparent 100%` : 'black 100%';
  return `linear-gradient(to right, ${from}, ${to})`;
}

/**
 * Проекты / Botanic Star 2 / Блок 3 / Этаж 7 / Квартира 34
 *
 * The last crumb is the current page. On narrow screens the trail scrolls
 * sideways instead of wrapping into a ragged block, and it OPENS AT ITS END:
 * the scroller is `flex-row-reverse`, whose scroll origin is the right edge,
 * so the current page is in view from the first paint (no JS needed). A fade
 * on whichever edge hides crumbs shows that the trail continues.
 *
 * `label` is the nav's accessible name, from the dictionary.
 */
export function Breadcrumbs({ items, label, className }: { items: Crumb[]; label?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState({ start: false, end: false });

  useEffect(() => {
    const nav = ref.current;
    const list = nav?.firstElementChild;
    if (!nav || !list) return;

    // Content clipped past the padding box on either side? Rect-based, so it
    // does not depend on how an engine signs scrollLeft in a reversed box.
    const measure = () => {
      const style = getComputedStyle(nav);
      const box = nav.getBoundingClientRect();
      const trail = list.getBoundingClientRect();
      const start = trail.left < box.left + parseFloat(style.paddingLeft) - 1;
      const end = trail.right > box.right - parseFloat(style.paddingRight) + 1;
      setHidden((h) => (h.start === start && h.end === end ? h : { start, end }));
    };

    // A reused scroller (client navigation) starts at the current crumb too.
    nav.scrollLeft = nav.scrollWidth;
    measure();

    nav.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    observer.observe(list);
    return () => {
      nav.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [items]);

  const mask = edgeMask(hidden.start, hidden.end);

  return (
    <nav
      ref={ref}
      aria-label={label}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={cn('no-scrollbar -mx-[var(--gutter)] flex flex-row-reverse overflow-x-auto px-[var(--gutter)]', className)}
    >
      <ol className="label mr-auto flex min-w-max shrink-0 items-center gap-3 text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-3">
              {c.href && !last ? (
                <Link href={c.href} className="link-line inline-flex min-h-11 items-center transition-colors hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('inline-flex min-h-11 items-center', last && 'text-ink')}>
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-muted/60">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
