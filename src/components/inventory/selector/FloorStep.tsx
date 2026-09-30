'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { ApartmentStatus, AvailabilityStats, Building, ProjectInventory } from '@/lib/inventory/types';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Arrow, Button } from '@/components/ui/Button';
import { formatEUR } from '../format';
import { Facade2D } from './Facade2D';
import { FloorInfoBar } from './FloorInfoBar';
import { tallOnly, useLastInput, wideOnlyInline } from './FloorPointer';
import { StatusLegend, barTone } from './StatusLegend';
import { counted, fill, floorAria, pad2, type CommonDict, type FloorsDict } from './FloorFormat';

/**
 * Step 2 — choose a floor. The elevation (left) and the floor list (right)
 * are one instrument: hovering a storey lights its row, hovering a row lights
 * the storey. Mouse click / Enter opens the floor plan; on touch the first
 * tap selects the storey and slides up an info bar with an explicit
 * "Открыть план этажа".
 */
export function FloorStep({
  inventory,
  building,
  locale,
  floorStats,
  floorHrefs,
  t,
  common,
}: {
  inventory: ProjectInventory;
  building: Building;
  locale: Locale;
  floorStats: Record<number, AvailabilityStats>;
  /** routes.floor for every residential floor (built on the server). */
  floorHrefs: Record<number, string>;
  t: FloorsDict;
  common: CommonDict;
}) {
  const router = useRouter();
  const lastInput = useLastInput();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // The bar keeps its last floor while sliding away.
  const [barFloor, setBarFloor] = useState<number | null>(null);
  if (selected !== null && selected !== barFloor) setBarFloor(selected);

  const floors = Object.keys(floorStats)
    .map(Number)
    .sort((a, b) => b - a);
  const active = hovered ?? selected;
  const name = building.name[locale];

  const open = useCallback(
    (floor: number, source: 'facade' | 'list' | 'bar') => {
      track('floor_select', {
        project: inventory.projectSlug,
        building: building.id,
        floor,
        available: floorStats[floor]?.available ?? 0,
        source,
      });
      if (source === 'facade') router.push(floorHrefs[floor]);
    },
    [building.id, floorHrefs, floorStats, inventory.projectSlug, router],
  );

  const hover = useCallback(
    (floor: number | null) => {
      setHovered(floor);
      if (floor !== null && floorHrefs[floor]) router.prefetch(floorHrefs[floor]);
    },
    [floorHrefs, router],
  );

  const select = (floor: number) => {
    if (lastInput.current === 'touch' && selected !== floor) {
      setSelected(floor);
      return;
    }
    open(floor, 'facade');
  };

  const bar = barFloor !== null ? floorStats[barFloor] : undefined;

  return (
    <>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-gutter">
        <figure className="lg:col-span-7">
          <figcaption className="flex items-baseline justify-between gap-6 border-b border-line/15 pb-4">
            {/* The same switch as the drawing (long / end façade). */}
            <h2 className="label text-muted">
              <span className={wideOnlyInline}>{t.facadeLong}</span>
              <span className={tallOnly}>{t.facadeEnd}</span>
            </h2>
            <span className="label text-muted">{name}</span>
          </figcaption>
          <Facade2D
            inventory={inventory}
            building={building}
            locale={locale}
            floorStats={floorStats}
            activeFloor={active}
            onHoverFloor={hover}
            onSelectFloor={select}
            t={t}
            common={common}
            className="mt-8 sm:mt-10"
          />
        </figure>

        <div className="lg:col-span-5">
          <h2 className="sr-only">{t.listTitle}</h2>
          <div aria-hidden="true" className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-x-4 border-b border-line/15 pb-4 pl-4 pr-2 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_1.5rem] sm:gap-x-6">
            <span className="label text-muted">{t.listHead.floor}</span>
            <span className="label text-muted">{t.listHead.available}</span>
            <span className="label text-right text-muted">{t.listHead.price}</span>
          </div>
          <ul>
            {floors.map((floor) => {
              const s = floorStats[floor];
              const on = active === floor;
              const none = s.available === 0;
              return (
                <li key={floor}>
                  <Link
                    href={floorHrefs[floor]}
                    aria-label={floorAria(t, floor, s, locale)}
                    onClick={() => open(floor, 'list')}
                    onMouseEnter={() => setHovered(floor)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(floor)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      'group relative grid min-h-[4.5rem] grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line/15 py-3.5 pl-4 pr-2 transition-colors duration-300 ease-premium sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_1.5rem] sm:gap-x-6',
                      on && 'bg-canvas-alt',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-0 left-0 w-px origin-bottom bg-accent transition-transform duration-500 ease-premium',
                        on ? 'scale-y-100' : 'scale-y-0',
                      )}
                    />
                    <span
                      className={cn(
                        'font-display text-display-md font-light leading-none tabular transition-colors duration-300',
                        none ? 'text-muted' : on ? 'text-accent' : 'text-ink',
                      )}
                    >
                      {pad2(floor)}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-sm tabular', none ? 'text-muted' : 'text-ink')}>
                        {fill(t.availableOf, { available: s.available, total: s.total })}
                      </span>
                      <AvailabilityBar stats={s} className="mt-2.5 max-w-[11rem]" />
                    </span>
                    <span className="text-right">
                      <span className={cn('block text-sm tabular', none ? 'text-muted' : 'text-ink')}>
                        {s.priceFrom !== null ? `${common.from} ${formatEUR(s.priceFrom, locale)}` : '—'}
                      </span>
                      {s.rooms.length > 0 && (
                        <span className="label mt-1.5 block text-muted">
                          {s.rooms.join(' · ')} {common.roomsShort}
                        </span>
                      )}
                    </span>
                    <Arrow className={cn('hidden sm:block', on ? 'translate-x-1 text-ink' : 'text-muted')} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <StatusLegend variant="bar" labels={common.statusPlural} className="mt-6 pl-4" />
        </div>
      </div>

      {/* Room for the touch bar at the end of the page. */}
      <div aria-hidden="true" className={cn('transition-[height] duration-500', selected !== null ? 'h-40' : 'h-0')} />

      <FloorInfoBar
        open={selected !== null}
        label={`${name} · ${common.floor} ${barFloor ?? ''}`}
        closeLabel={t.close}
        onClose={() => setSelected(null)}
        action={
          barFloor !== null && (
            <Button href={floorHrefs[barFloor]} arrow onClick={() => open(barFloor, 'bar')}>
              {t.openFloor}
            </Button>
          )
        }
      >
        {barFloor !== null && bar && (
          <>
            <p className="label text-muted">
              {name} · {common.floor} {barFloor}
            </p>
            <p className="mt-2 font-display text-display-sm font-light">
              {bar.available > 0
                ? fill(t.availableTag, { count: counted(t.apartmentsForms, bar.available, locale) })
                : t.noneAvailable}
            </p>
            {bar.priceFrom !== null && (
              <p className="mt-1 text-sm tabular text-muted">
                {common.from} {formatEUR(bar.priceFrom, locale)}
              </p>
            )}
          </>
        )}
      </FloorInfoBar>
    </>
  );
}

const STATUS_ORDER: ApartmentStatus[] = ['available', 'reserved', 'sold'];

/** One hairline segment per apartment: available first, then reserved, then sold. */
function AvailabilityBar({ stats, className }: { stats: AvailabilityStats; className?: string }) {
  const segments = STATUS_ORDER.flatMap((st) => Array.from({ length: stats[st] }, () => st));
  return (
    <span aria-hidden="true" className={cn('flex h-[3px] gap-[2px]', className)}>
      {segments.map((st, i) => (
        <span key={i} className={cn('h-full flex-1', barTone[st])} />
      ))}
    </span>
  );
}
