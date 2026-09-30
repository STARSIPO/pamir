'use client';

import type { Locale } from '@/i18n/config';
import type { Apartment, ApartmentStatus } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';
import { formatArea, formatEUR } from '../format';
import { roomsLabel, type CommonDict, type FloorsDict } from './FloorFormat';

/**
 * The apartment at a glance, shown over the floor plan:
 *
 *   КВАРТИРА №34                    ■ ДОСТУПНА
 *   3 комнаты · 84,6 м² · Этаж 7
 *   Цена                         от €122 700
 *
 * Reserved apartments show the same facts with the price in a muted tone (the
 * list beside the plan shows it too); sold ones only their number and status.
 *
 *   float — small card that follows the mouse (FloorPlanStep positions it
 *           through `ref`; pointer-events off, so it never steals the hover).
 *   panel — the same content laid out for the touch info bar.
 */
export function ApartmentHoverCard({
  apartment: a,
  locale,
  common,
  t,
  variant = 'float',
  visible = true,
  ref,
  className,
}: {
  apartment: Apartment;
  locale: Locale;
  common: CommonDict;
  t: FloorsDict;
  variant?: 'float' | 'panel';
  visible?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  const full = a.status !== 'sold';
  const available = a.status === 'available';
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-5">
        <p className="label whitespace-nowrap text-ink">
          {common.apartmentNo}
          {a.number}
        </p>
        <StatusMark status={a.status} label={common.status[a.status]} />
      </div>
      {full && (
        <>
          <p className="mt-2.5 text-sm text-muted">
            {roomsLabel(common, a.rooms)} · <span className="whitespace-nowrap tabular">{formatArea(a.area, locale)} {common.sqm}</span> ·{' '}
            <span className="whitespace-nowrap">
              {common.floor} {a.floor}
            </span>
          </p>
          <div className={cn('flex items-baseline justify-between gap-5', variant === 'float' ? 'mt-4 border-t border-line/15 pt-3' : 'mt-2')}>
            <span className="label text-muted">{t.price}</span>
            <span
              className={cn(
                'whitespace-nowrap font-display text-display-sm font-light tabular',
                available ? 'text-ink' : 'text-muted',
              )}
            >
              <span className="text-base text-muted">{common.from}</span> {formatEUR(a.totalPrice, locale)}
            </span>
          </div>
        </>
      )}
    </>
  );

  if (variant === 'panel') return <div className={className}>{body}</div>;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-0 top-0 z-10 w-max min-w-[17rem] max-w-[22rem] border border-line/15 bg-surface px-5 py-4 text-ink transition-opacity duration-200 ease-premium',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {body}
    </div>
  );
}

/** Small status square + label, in the colours of the plan. */
export function StatusMark({ status, label, className }: { status: ApartmentStatus; label: string; className?: string }) {
  return (
    <span className={cn('label inline-flex shrink-0 items-center gap-2 text-muted', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2',
          status === 'available' && 'border border-accent-strong bg-accent/20',
          status === 'reserved' && 'border border-ink/40 bg-[repeating-linear-gradient(45deg,rgb(var(--ink)/0.45)_0_1px,transparent_1px_3px)]',
          status === 'sold' && 'border border-ink/30',
        )}
      />
      {label}
    </span>
  );
}
