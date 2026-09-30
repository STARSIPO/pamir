'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { Apartment, Building, FloorPlate, ProjectInventory } from '@/lib/inventory/types';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Arrow, Button } from '@/components/ui/Button';
import { formatArea, formatEUR } from '../format';
import { ApartmentHoverCard, StatusMark } from './ApartmentHoverCard';
import { FloorInfoBar } from './FloorInfoBar';
import { FloorPlan2D } from './FloorPlan2D';
import { canHover, isFocusVisible, useLastInput } from './FloorPointer';
import { StatusLegend } from './StatusLegend';
import { apartmentAria, fill, roomsLabel, type CommonDict, type FloorsDict } from './FloorFormat';

type HoverSource = 'plan' | 'list';
/** How a plan hover came about: a hovering pointer, or keyboard focus. */
type HoverVia = 'pointer' | 'focus';

/**
 * Step 3 — choose an apartment on the floor plan. The plan and the list of
 * the floor's apartments are synced both ways. On the plan, a mouse hover
 * shows a small card by the pointer and a click opens the apartment; keyboard
 * focus anchors the card to the zone and Enter opens it. On touch, the first
 * tap selects the apartment and slides up an info bar with "Подробнее" — no
 * floating card there: it only ever follows a hovering pointer (and only on
 * `(hover: hover)` screens) or keyboard focus.
 * Sold apartments show their status only and never open.
 */
export function FloorPlanStep({
  inventory,
  building,
  plate,
  floor,
  apartments,
  apartmentHrefs,
  locale,
  t,
  common,
}: {
  inventory: ProjectInventory;
  building: Building;
  plate: FloorPlate;
  floor: number;
  apartments: Apartment[];
  /** routes.apartment for every apartment of the floor (built on the server). */
  apartmentHrefs: Record<string, string>;
  locale: Locale;
  t: FloorsDict;
  common: CommonDict;
}) {
  const router = useRouter();
  const lastInput = useLastInput();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; source: HoverSource; via?: HoverVia } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Card and bar keep their last apartment while fading / sliding away.
  const [cardId, setCardId] = useState<string | null>(null);
  const [cardVia, setCardVia] = useState<HoverVia>('pointer');
  if (hover?.source === 'plan' && hover.via && hover.via !== cardVia) setCardVia(hover.via);
  const [barId, setBarId] = useState<string | null>(null);
  if (hover?.source === 'plan' && hover.id !== cardId) setCardId(hover.id);
  if (selected !== null && selected !== barId) setBarId(selected);

  const byId = useCallback((id: string | null) => apartments.find((a) => a.id === id), [apartments]);
  const sorted = [...apartments].sort((a, b) => Number(a.number) - Number(b.number));
  const activeId = hover?.id ?? selected;
  const cardApt = byId(cardId);
  const barApt = byId(barId);
  const cardVisible = hover?.source === 'plan' && !!cardApt;

  const open = useCallback(
    (a: Apartment, source: 'plan' | 'list' | 'bar') => {
      track('apartment_open', {
        project: inventory.projectSlug,
        building: building.id,
        floor,
        apartment: a.id,
        number: a.number,
        status: a.status,
        source,
      });
      if (source === 'plan') router.push(apartmentHrefs[a.id]);
    },
    [apartmentHrefs, building.id, floor, inventory.projectSlug, router],
  );

  const onHoverApartment = useCallback(
    (id: string | null) => {
      // FloorPlan2D reports keyboard focus (never a tap's focus) and hovering
      // pointers through the same callback; the focused zone tells them apart.
      const el = document.activeElement;
      const focus =
        !!id && el instanceof SVGElement && el.getAttribute('data-apartment') === id && isFocusVisible(el);
      setHover(id ? { id, source: 'plan', via: focus ? 'focus' : 'pointer' } : null);
      const a = id ? byId(id) : undefined;
      if (a && a.status !== 'sold') router.prefetch(apartmentHrefs[a.id]);
    },
    [apartmentHrefs, byId, router],
  );

  const onSelectApartment = (id: string) => {
    const a = byId(id);
    if (!a) return;
    if (lastInput.current === 'touch') {
      if (selected === id && a.status !== 'sold') open(a, 'plan');
      else setSelected(id);
      return;
    }
    if (a.status !== 'sold') open(a, 'plan');
  };

  // Place the card by the pointer (mouse / pen) without re-rendering the plan.
  const pointer = useRef<[number, number] | null>(null);
  const place = useCallback((clientX: number, clientY: number, gap = 18) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const r = wrap.getBoundingClientRect();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let x = clientX - r.left + gap;
    let y = clientY - r.top + gap;
    if (x + cw > r.width) x = clientX - r.left - cw - gap;
    if (y + ch > r.height) y = clientY - r.top - ch - gap;
    x = Math.max(0, Math.min(x, r.width - cw));
    y = Math.max(0, y);
    card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, []);

  // Keyboard: beside the focused zone (right, else left, else below it).
  const anchor = useCallback((zone: DOMRect) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const r = wrap.getBoundingClientRect();
    const cw = card.offsetWidth;
    const gap = 12;
    const right = zone.right - r.left + gap;
    const left = zone.left - r.left - cw - gap;
    let x = right;
    let y = zone.top - r.top;
    if (right + cw > r.width) {
      if (left >= 0) x = left;
      else {
        x = Math.max(0, Math.min(zone.left - r.left, r.width - cw));
        y = zone.bottom - r.top + gap;
      }
    }
    card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(Math.max(0, y))}px, 0)`;
  }, []);

  // Before paint: by the pointer for a mouse, beside the focused zone for the
  // keyboard — so the card never flashes at the corner when it first mounts.
  useLayoutEffect(() => {
    if (hover?.source !== 'plan') return;
    const el = document.activeElement;
    if (hover.via === 'focus' && el instanceof SVGElement && wrapRef.current?.contains(el)) {
      anchor(el.getBoundingClientRect());
    } else if (pointer.current) {
      place(pointer.current[0], pointer.current[1]);
    }
  }, [hover, cardId, place, anchor]);

  const countBy = (s: Apartment['status']) => apartments.filter((a) => a.status === s).length;

  return (
    <>
      <div className="grid gap-12 xl:grid-cols-12 xl:gap-gutter">
        <figure className="xl:col-span-8">
          <figcaption className="flex flex-col gap-4 border-b border-line/15 pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
            <span className="label text-muted">
              {t.planCaption} · {building.name[locale]} · {common.floor} {floor}
            </span>
            <StatusLegend
              labels={common.statusPlural}
              counts={{ available: countBy('available'), reserved: countBy('reserved'), sold: countBy('sold') }}
            />
          </figcaption>
          <div
            ref={wrapRef}
            className="relative mt-6 sm:mt-8"
            onPointerMove={(e) => {
              if (!canHover(e.pointerType)) return;
              pointer.current = [e.clientX, e.clientY];
              place(e.clientX, e.clientY);
            }}
          >
            <FloorPlan2D
              inventory={inventory}
              building={building}
              plate={plate}
              floor={floor}
              apartments={apartments}
              locale={locale}
              activeApartmentId={activeId}
              onHoverApartment={onHoverApartment}
              onSelectApartment={onSelectApartment}
              t={t}
              common={common}
            />
            {cardApt && (
              <ApartmentHoverCard
                ref={cardRef}
                apartment={cardApt}
                locale={locale}
                common={common}
                t={t}
                visible={cardVisible}
                // A pointer card only where a pointer can hover; the keyboard
                // card wherever the landscape plan is drawn.
                className={cardVia === 'focus' ? 'hidden md:block' : 'hidden md:[@media(hover:hover)]:block'}
              />
            )}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{t.planNote}</p>
        </figure>

        <div className="xl:col-span-4">
          <h2 className="label border-b border-line/15 pb-4 text-muted">
            {t.apartmentsTitle} <span className="tabular text-ink">{apartments.length}</span>
          </h2>
          <ul className="lg:grid lg:grid-cols-2 lg:gap-x-gutter xl:block">
            {sorted.map((a) => {
              const on = activeId === a.id;
              const sold = a.status === 'sold';
              const rowClass = cn(
                'group relative flex min-h-[4.75rem] items-center gap-5 border-b border-line/15 py-3.5 pl-4 pr-2 transition-colors duration-300 ease-premium',
                on && 'bg-canvas-alt',
              );
              const content = (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 w-px origin-bottom transition-transform duration-500 ease-premium',
                      a.status === 'available' ? 'bg-accent' : 'bg-ink/40',
                      on ? 'scale-y-100' : 'scale-y-0',
                    )}
                  />
                  <span
                    className={cn(
                      'w-14 shrink-0 font-display text-display-sm font-light leading-none tabular transition-colors duration-300',
                      sold ? 'text-muted' : on && a.status === 'available' ? 'text-accent' : 'text-ink',
                    )}
                  >
                    {a.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm', sold ? 'text-muted' : 'text-ink')}>
                      {roomsLabel(common, a.rooms)} ·{' '}
                      <span className="whitespace-nowrap tabular">
                        {formatArea(a.area, locale)} {common.sqm}
                      </span>
                    </span>
                    <StatusMark status={a.status} label={common.status[a.status]} className="mt-1.5" />
                  </span>
                  <span className={cn('shrink-0 text-right text-sm tabular', sold ? 'text-muted' : 'text-ink')}>
                    {sold ? '—' : formatEUR(a.totalPrice, locale)}
                  </span>
                  {!sold && <Arrow className={cn('hidden shrink-0 sm:block', on ? 'translate-x-1 text-ink' : 'text-muted')} />}
                  {sold && <span aria-hidden="true" className="hidden w-6 shrink-0 sm:block" />}
                </>
              );
              return (
                <li key={a.id}>
                  {sold ? (
                    <div
                      className={rowClass}
                      aria-label={apartmentAria(t, common, a, locale)}
                      role="group"
                      onMouseEnter={() => setHover({ id: a.id, source: 'list' })}
                      onMouseLeave={() => setHover(null)}
                    >
                      {content}
                    </div>
                  ) : (
                    <Link
                      href={apartmentHrefs[a.id]}
                      aria-label={apartmentAria(t, common, a, locale)}
                      className={rowClass}
                      onClick={() => open(a, 'list')}
                      onMouseEnter={() => setHover({ id: a.id, source: 'list' })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ id: a.id, source: 'list' })}
                      onBlur={() => setHover(null)}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Room for the touch bar at the end of the page. */}
      <div aria-hidden="true" className={cn('transition-[height] duration-500', selected !== null ? 'h-40' : 'h-0')} />

      <FloorInfoBar
        open={selected !== null}
        label={barApt ? fill(t.statusOnly, { number: barApt.number, status: common.status[barApt.status] }) : t.planCaption}
        closeLabel={t.close}
        onClose={() => setSelected(null)}
        action={
          barApt &&
          barApt.status !== 'sold' && (
            <Button href={apartmentHrefs[barApt.id]} arrow onClick={() => open(barApt, 'bar')}>
              {t.details}
            </Button>
          )
        }
      >
        {barApt && <ApartmentHoverCard apartment={barApt} locale={locale} common={common} t={t} variant="panel" />}
      </FloorInfoBar>
    </>
  );
}
