import Link from 'next/link';
import type { Apartment, ApartmentStatus } from '@/lib/inventory/types';
import { Arrow } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { StatusMark } from './ApartmentStatus';
import { fill } from './text';

export interface PagerLabels {
  label: string;
  /** «Предыдущая квартира на этаже: №{n}, {status}» */
  prev: string;
  next: string;
  /** «{i} из {total} на этаже» — the apartment's place among the floor's. */
  position: string;
  backToFloor: string;
  /** Phones: «План этажа». */
  backToFloorShort: string;
}

/**
 * Beside the title (under it on phones): back to the floor plan, and a step
 * through the other apartments of the same floor.
 *
 *   ← ВЕРНУТЬСЯ К ПЛАНУ ЭТАЖА        [‹ ■ 33]  3 ИЗ 8 НА ЭТАЖЕ  [■ 35 ›]
 *   ← ПЛАН ЭТАЖА                                      [‹ ■ 33]  [■ 35 ›]   (phones)
 *
 * The neighbours carry their status mark — and say it in their accessible
 * name — so a buyer knows before stepping whether the next one is free.
 * Ends are closed, not wrapped.
 */
export function ApartmentPager({
  prev,
  next,
  index,
  total,
  floorHref,
  hrefOf,
  labels,
  statusLabel,
  className,
}: {
  prev: Apartment | null;
  next: Apartment | null;
  index: number;
  total: number;
  floorHref: string;
  hrefOf: Record<string, string>;
  labels: PagerLabels;
  /** Status words for the neighbours' accessible names, lower case («продана»). */
  statusLabel: Record<ApartmentStatus, string>;
  className?: string;
}) {
  const step = 'group flex h-11 min-w-11 items-center justify-center gap-2 border border-line/20 px-3 transition-colors duration-500 ease-premium';
  const name = (tpl: string, a: Apartment) => fill(tpl, { n: a.number, status: statusLabel[a.status] });
  return (
    <nav
      aria-label={labels.label}
      className={cn('flex items-center justify-between gap-x-8 gap-y-4 sm:flex-wrap sm:justify-start lg:justify-end', className)}
    >
      <Link
        href={floorHref}
        className="group label inline-flex min-h-11 items-center gap-3 text-muted transition-colors duration-500 hover:text-ink"
      >
        <Arrow className="w-5 rotate-180 group-hover:-translate-x-1" />
        <span className="link-line sm:hidden">{labels.backToFloorShort}</span>
        <span className="link-line max-sm:hidden">{labels.backToFloor}</span>
      </Link>

      <div className="flex items-center gap-3">
        {prev ? (
          <Link href={hrefOf[prev.id]} aria-label={name(labels.prev, prev)} className={cn(step, 'text-ink hover:border-ink')}>
            <Chevron dir="left" />
            <StatusMark status={prev.status} />
            <span className="label tabular">{prev.number}</span>
          </Link>
        ) : (
          <span aria-hidden="true" className={cn(step, 'text-muted/40')}>
            <Chevron dir="left" />
          </span>
        )}
        {/* The place on the floor; phones keep just the two steps. */}
        <span className="label tabular text-muted max-sm:sr-only">
          {fill(labels.position, { i: index + 1, total })}
        </span>
        {next ? (
          <Link href={hrefOf[next.id]} aria-label={name(labels.next, next)} className={cn(step, 'text-ink hover:border-ink')}>
            <span className="label tabular">{next.number}</span>
            <StatusMark status={next.status} />
            <Chevron dir="right" />
          </Link>
        ) : (
          <span aria-hidden="true" className={cn(step, 'text-muted/40')}>
            <Chevron dir="right" />
          </span>
        )}
      </div>
    </nav>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 8 12" aria-hidden="true" className="h-3 w-2 shrink-0" fill="none">
      <path d={dir === 'left' ? 'M7 1 2 6l5 5' : 'M1 1l5 5-5 5'} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
