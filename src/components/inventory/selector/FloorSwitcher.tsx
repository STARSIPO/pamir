'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Floor switcher on the floor-plan step: previous / next and a compact row of
 * every residential floor. Links keep the scroll position (`scroll={false}`),
 * so the buyer stays on the plan while stepping through the building. A short
 * accent tick under a number marks floors with apartments available. On a
 * narrow screen the row scrolls sideways, centred on the current floor.
 *
 *   ЭТАЖ   ←   2  3  4  5  6 [7] 8  9  10   →
 */
export function FloorSwitcher({
  floors,
  current,
  label,
  prevLabel,
  nextLabel,
  floorWord,
  className,
}: {
  floors: { floor: number; href: string; available: number }[];
  current: number;
  label: string;
  prevLabel: string;
  nextLabel: string;
  floorWord: string;
  className?: string;
}) {
  const i = floors.findIndex((f) => f.floor === current);
  const prev = i > 0 ? floors[i - 1] : null;
  const next = i >= 0 && i < floors.length - 1 ? floors[i + 1] : null;
  const row = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const ol = row.current;
    const li = ol?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!ol || !li || ol.scrollWidth <= ol.clientWidth) return;
    // The row is the offset parent (`relative`), so offsetLeft is row-local.
    ol.scrollLeft = li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2;
  }, [current]);

  return (
    <nav aria-label={label} className={cn('flex items-center gap-4', className)}>
      <span className="label hidden shrink-0 text-muted md:inline">{label}</span>
      <StepLink item={prev} label={prevLabel} dir="prev" />
      <ol ref={row} className="no-scrollbar relative -my-1 flex min-w-0 items-center overflow-x-auto py-1">
        {floors.map((f) => {
          const on = f.floor === current;
          return (
            <li key={f.floor} className="shrink-0">
              <Link
                href={f.href}
                scroll={false}
                aria-current={on ? 'page' : undefined}
                aria-label={`${floorWord} ${f.floor}`}
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center text-sm tabular transition-colors duration-300',
                  // A sold-out floor stays full muted (AA, still a live link):
                  // the missing accent tick is what says "nothing free".
                  on ? 'border border-ink/70 text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {f.floor}
                {f.available > 0 && !on && (
                  <span aria-hidden="true" className="absolute bottom-2 left-1/2 h-px w-2.5 -translate-x-1/2 bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
      <StepLink item={next} label={nextLabel} dir="next" />
    </nav>
  );
}

function StepLink({
  item,
  label,
  dir,
}: {
  item: { floor: number; href: string } | null;
  label: string;
  dir: 'prev' | 'next';
}) {
  const icon = (
    <svg viewBox="0 0 24 12" fill="none" aria-hidden="true" className={cn('h-3 w-6', dir === 'prev' && 'rotate-180')}>
      <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  const base = 'flex h-11 w-11 shrink-0 items-center justify-center border border-line/15 transition-colors duration-300';
  if (!item) {
    return (
      <span aria-hidden="true" className={cn(base, 'text-muted/40')}>
        {icon}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      scroll={false}
      aria-label={`${label}: ${item.floor}`}
      className={cn(base, 'text-muted hover:border-ink/60 hover:text-ink')}
    >
      {icon}
    </Link>
  );
}
