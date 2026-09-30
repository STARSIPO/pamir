'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { ViewerMode } from '@/components/inventory/viewer/types';
import type { Apartment } from '@/lib/inventory/types';
import { track } from '@/lib/analytics';
import { getLenis } from '@/lib/smooth-scroll';
import { formatArea } from '@/lib/pricing/engine';
import { cn } from '@/lib/utils';
import { ApartmentPlan2D, type PlanLabels, type PlanOrientationProps } from './ApartmentPlan2D';
import { Model3DSlot, type Model3DLabels } from './Model3DSlot';
import { isOutdoor, orderedRooms } from './geometry';
import { pad2 } from './text';

export interface ViewerLabels {
  title: string;
  modeLabel: string;
  mode2d: string;
  mode3d: string;
  soon: string;
  explication: string;
  indoorTotal: string;
  model3d: Model3DLabels;
  plan: PlanLabels;
}

/**
 * Glide an element into view below the compact header — through Lenis when
 * it drives the page, natively otherwise (instantly under reduced motion).
 */
function glideTo(el: HTMLElement, gap = 16) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || 68;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: -(header + gap) });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - header - gap, behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * The apartment's main grid: a "2D | 3D" switch over a paper plate holding
 * the current viewer, the explication (room list) synced both ways with the
 * drawing — hover a row, the room washes; hover a room, its row lights up;
 * a row is a toggle that pins its room — and the `aside` (the facts card,
 * rendered on the server).
 *
 *   lg+   plan  (7–8 cols)   | aside (4–5 cols, spans both rows)
 *         explication        |
 *   <lg   plan → aside → explication: the price and the lead button come
 *         right after the drawing, not after the whole room list. There the
 *         plan is far above the list, so pinning a row glides back to it.
 *
 * `ViewerMode` switches between the 2D plan and the 3D scene (Model3DSlot).
 * Both implement ApartmentViewProps, so the selection state kept here
 * (hovered / pinned room) survives a mode change. Until an apartment has a
 * model, «3D — скоро» opens the slot's quiet "coming soon" plate, which leads
 * back to the plan.
 */
export function PlanViewer({
  apartment,
  locale,
  labels,
  orientation,
  aside,
}: {
  apartment: Apartment;
  locale: Locale;
  labels: ViewerLabels;
  orientation: PlanOrientationProps;
  aside?: React.ReactNode;
}) {
  const [mode, setMode] = useState<ViewerMode>('2d');
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const button2dRef = useRef<HTMLButtonElement>(null);
  const active = hovered ?? pinned;
  const has3D = !!apartment.model3D;

  // The view of the selector's last step. 'apartment_open' stays the click
  // that leads here (floor plan, list, recommendations), so a visit is not
  // counted twice.
  useEffect(() => {
    track('selector_view', {
      step: 'apartment',
      project: apartment.projectSlug,
      building: apartment.buildingId,
      floor: apartment.floor,
      apartment: apartment.id,
      status: apartment.status,
      rooms: apartment.rooms,
    });
  }, [apartment.id, apartment.projectSlug, apartment.buildingId, apartment.floor, apartment.status, apartment.rooms]);

  const choose = (next: ViewerMode) => {
    if (next === mode) return;
    setMode(next);
    track('apartment_view_mode', { mode: next, apartment: apartment.id, available: next === '2d' || has3D });
  };
  const select = (id: string) => setPinned((p) => (p === id ? null : id));

  // A row pinned where the plan is out of sight (below lg the list sits under
  // the facts card) brings the plan back into view.
  const pinFromList = (id: string) => {
    const pinning = pinned !== id;
    select(id);
    const plate = plateRef.current;
    if (!pinning || !plate || window.matchMedia('(min-width: 1024px)').matches) return;
    const r = plate.getBoundingClientRect();
    if (r.bottom < 120 || r.top > window.innerHeight - 120) glideTo(plate);
  };

  const rooms = useMemo(() => orderedRooms(apartment.plan2D.rooms), [apartment.plan2D.rooms]);
  const sqm = `${labels.plan.metre}²`;

  // The view contract (ApartmentViewProps): the same selection reaches the
  // 2D plan today and the 3D scene later.
  const view = {
    apartment,
    locale,
    activeRoomId: active,
    onHoverRoom: setHovered,
    pinnedRoomId: pinned,
    onSelectRoom: select,
  };

  return (
    <div className="grid gap-y-16 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-gutter lg:gap-y-12">
      <section aria-labelledby="apartment-plan-title" className="min-w-0 lg:col-span-7 lg:row-start-1 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <h2 id="apartment-plan-title" className="label flex items-center gap-3 text-muted">
            <span aria-hidden="true" className="h-px w-6 bg-accent" />
            {labels.title}
          </h2>

          {/* Segmented 2D | 3D switch. Without a model, 3D shows the "soon" plate. */}
          <div role="group" aria-label={labels.modeLabel} className="inline-flex border border-line/20">
            {(['2d', '3d'] as const).map((m) => {
              const on = mode === m;
              const soon = m === '3d' && !has3D;
              return (
                <button
                  key={m}
                  ref={m === '2d' ? button2dRef : undefined}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(m)}
                  className={cn(
                    'label flex min-h-11 items-center gap-2 px-5 transition-colors duration-300 ease-premium',
                    on ? 'bg-ink text-canvas' : soon ? 'text-muted hover:bg-ink/5 hover:text-ink' : 'text-ink hover:bg-ink/5',
                  )}
                >
                  <span className="tabular">{m === '2d' ? labels.mode2d : labels.mode3d}</span>
                  {soon && (
                    <span>
                      <span aria-hidden="true">— </span>
                      {labels.soon}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The plate: the drawing sits on the surface tone in a hairline frame.
            On phones it runs edge to edge — every pixel of width is plan. */}
        <div
          ref={plateRef}
          className="mt-5 border border-line/15 bg-surface px-3 pb-3 pt-5 max-sm:-mx-[var(--gutter)] max-sm:border-x-0 sm:px-8 sm:pb-4 sm:pt-6 md:px-12 md:pb-6 md:pt-10"
        >
          {mode === '2d' ? (
            <ApartmentPlan2D
              key={apartment.id}
              {...view}
              labels={labels.plan}
              orientation={orientation}
            />
          ) : (
            <Model3DSlot
              {...view}
              labels={labels.model3d}
              onBack={() => {
                choose('2d');
                // The plate (and its button) goes; focus lands on the switch.
                button2dRef.current?.focus();
              }}
            />
          )}
        </div>
      </section>

      {aside && (
        <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 xl:col-span-4 xl:col-start-9">
          {aside}
        </div>
      )}

      {/* Explication — the plan as a list, synced with the drawing. Each row
          is a toggle that pins its room (click, tap, Enter or Space). */}
      <section aria-labelledby="apartment-rooms-title" className="min-w-0 self-start lg:col-span-7 lg:row-start-2 xl:col-span-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line/15 pb-4">
          <h2 id="apartment-rooms-title" className="label text-muted">
            {labels.explication}
          </h2>
          <p className="text-sm text-muted">
            {labels.indoorTotal}{' '}
            <span className="whitespace-nowrap font-display text-base font-light tabular text-ink md:text-lg">
              {formatArea(apartment.area, locale)} {sqm}
            </span>
          </p>
        </div>
        <ol className="grid md:grid-cols-2 md:gap-x-gutter">
          {rooms.map((r, i) => {
            const on = active === r.id;
            const pin = pinned === r.id;
            return (
              <li key={r.id} className="border-b border-line/15">
                <button
                  type="button"
                  aria-pressed={pin}
                  onClick={() => pinFromList(r.id)}
                  onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(r.id)}
                  onPointerLeave={(e) => e.pointerType !== 'touch' && setHovered(null)}
                  onFocus={(e) => e.currentTarget.matches(':focus-visible') && setHovered(r.id)}
                  onBlur={() => setHovered((h) => (h === r.id ? null : h))}
                  className={cn(
                    'relative flex min-h-12 w-full items-baseline gap-4 py-3 text-left transition-colors duration-300 ease-premium',
                    on && 'bg-accent/[0.07]',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 w-px origin-top bg-accent transition-transform duration-500 ease-premium',
                      on || pin ? 'scale-y-100' : 'scale-y-0',
                    )}
                  />
                  <span className={cn('label w-7 shrink-0 pl-2 tabular', on || pin ? 'text-ink' : 'text-muted')}>
                    {pad2(i + 1)}
                  </span>
                  <span className={cn('flex-1 text-base', isOutdoor(r.type) ? 'text-muted' : 'text-ink')}>
                    {labels.plan.room[r.type]}
                  </span>
                  <span className="pr-2 font-display text-base font-light tabular text-ink md:text-[1.0625rem]">
                    {formatArea(r.area, locale)} <span className="text-sm text-muted">{sqm}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
