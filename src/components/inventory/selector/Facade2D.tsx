'use client';

import { useId, useMemo, useState } from 'react';
import type { BuildingViewProps } from '../viewer/types';
import type { AvailabilityStats } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';
import { formatEUR } from '../format';
import { FloorMotionStyles, delay } from './FloorMotion';
import { canHover, isFocusVisible, tallOnly, wideOnly } from './FloorPointer';
import { useDrawingScale } from './FloorScale';
import { endElevation, longElevation, type FacadeFloor, type FacadeGeometry } from './FacadeGeometry';
import { counted, fill, floorAria, type CommonDict, type FloorsDict } from './FloorFormat';

export interface Facade2DProps extends BuildingViewProps {
  t: FloorsDict;
  common: CommonDict;
  className?: string;
}

/**
 * Step 2 — the building as a 2D elevation (implements BuildingViewProps; a 3D
 * building scene can take its place with the same props).
 *
 * A line drawing generated from the data: the non-residential ground floor,
 * the residential storeys with their window rhythm and balcony slabs, the
 * parapet and lift overrun. Each residential storey is a keyboard-focusable
 * band: hover or keyboard focus lays a soft accent wash and contour over it
 * and opens a side tag — "Этаж 7 · Доступно: 4 квартиры". Storeys with
 * nothing available are drawn dimmed but still open.
 *
 * Mouse / pen from md: the long façade, with the tag in its own column beside
 * it (a fixed measure, so the drawing gives way — never the tag's words).
 * Touch screens and narrow windows: the narrow end façade, so every storey
 * stays a ≥ 44 px tap target; the touch info bar carries the numbers there.
 */
export function Facade2D(props: Facade2DProps) {
  const { inventory, building, className } = props;
  const long = useMemo(() => longElevation(inventory, building), [inventory, building]);
  const end = useMemo(() => endElevation(inventory, building), [inventory, building]);

  return (
    <div className={cn('relative', className)}>
      <FloorMotionStyles />
      <div className={wideOnly}>
        <div className="flex items-stretch">
          <div className="min-w-0 flex-1">
            <FacadeSvg geom={long} {...props} />
          </div>
          {/* The tag's measure: its longest line ("7 apartamente") at the
              count's size — text-lead below xl, display-sm from xl. */}
          <div className="relative w-[11rem] shrink-0 lg:w-[9.75rem] xl:w-[12.5rem]">
            <FacadeTag geom={long} {...props} />
          </div>
        </div>
      </div>
      <div className={cn('mx-auto max-w-[26rem]', tallOnly)}>
        <FacadeSvg geom={end} {...props} />
      </div>
    </div>
  );
}

function FacadeSvg({
  geom,
  building,
  locale,
  floorStats,
  activeFloor,
  onHoverFloor,
  onSelectFloor,
  t,
}: Facade2DProps & { geom: FacadeGeometry }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const earth = `${uid}-earth`;
  const { view, mass, parapet, overrun, ground } = geom;
  const name = building.name[locale];
  const dimmed = (f: FacadeFloor) => f.residential && (floorStats[f.floor]?.available ?? 0) === 0;
  const n = geom.floors.length;
  // Level numbers and the ground note in metres, never under 11 / 10 px.
  const { ref, atLeast } = useDrawingScale(view.w);
  const fsLevel = atLeast(0.95, 11);
  const fsGround = atLeast(0.78, 10);

  return (
    <svg
      ref={ref}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      className="block h-auto w-full touch-manipulation select-none"
      role="group"
      aria-label={fill(t.facadeAria, { building: name })}
    >
      <defs>
        <pattern id={earth} patternUnits="userSpaceOnUse" width="0.45" height="0.45" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.45" className="stroke-ink/25" strokeWidth="0.05" />
        </pattern>
      </defs>

      {/* Ground: a hatched strip of earth under a firm ground line. */}
      <g aria-hidden="true" className="invf-fade">
        <rect x={ground.x0} y={0} width={ground.x1 - ground.x0} height={ground.depth} fill={`url(#${earth})`} />
        <line
          x1={ground.x0}
          x2={ground.x1}
          y1={0}
          y2={0}
          className="stroke-ink/60"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={geom.groundLabel.x}
          y={geom.groundLabel.y}
          fontSize={fsGround}
          letterSpacing={fsGround * 0.15}
          className="fill-muted uppercase"
        >
          {t.groundFloor}
        </text>
      </g>

      {/* The building rises from its base. */}
      <g aria-hidden="true" className="invf-rise" style={delay(120)}>
        {overrun && (
          <rect
            x={overrun.x}
            y={overrun.y}
            width={overrun.w}
            height={overrun.h}
            className="fill-canvas-alt stroke-ink/40"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <rect x={mass.x} y={mass.y} width={mass.w} height={mass.h} className="fill-surface" />
        <rect
          x={parapet.x}
          y={parapet.y}
          width={parapet.w}
          height={parapet.h}
          className="fill-surface stroke-ink/50"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {geom.floors.map((f) => (
          <g
            key={f.floor}
            className={cn('transition-opacity duration-500 ease-premium', dimmed(f) && 'opacity-40')}
          >
            {f.floor > 1 && (
              <line
                x1={f.band.x}
                x2={f.band.x + f.band.w}
                y1={f.band.y + f.band.h}
                y2={f.band.y + f.band.h}
                className="stroke-ink/15"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {f.openings.map((o, i) => (
              <g key={i}>
                <rect
                  x={o.x}
                  y={o.y}
                  width={o.w}
                  height={o.h}
                  className={f.residential ? 'fill-ink/[0.06] stroke-ink/35' : 'fill-ink/[0.04] stroke-ink/30'}
                  strokeWidth={0.75}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Mullion on French doors and shop fronts only. */}
                {(o.door || !f.residential) && (
                  <line
                    x1={o.x + o.w / 2}
                    x2={o.x + o.w / 2}
                    y1={o.y}
                    y2={o.y + o.h}
                    className="stroke-ink/20"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            ))}
            {/* Balconies: a glass balustrade (faint pane, one top rail) on a slab. */}
            {f.projections.map((p, i) => (
              <g key={`p${i}`}>
                <rect x={p.rail.x} y={p.rail.y} width={p.rail.w} height={p.rail.h} className="fill-canvas-alt" />
                <rect x={p.rail.x} y={p.rail.y} width={p.rail.w} height={p.rail.h} className="fill-ink/[0.06]" />
                <line
                  x1={p.rail.x}
                  x2={p.rail.x + p.rail.w}
                  y1={p.rail.y}
                  y2={p.rail.y}
                  className="stroke-ink/45"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <rect x={p.slab.x} y={p.slab.y} width={p.slab.w} height={p.slab.h} className="fill-ink/45" />
              </g>
            ))}
          </g>
        ))}

        <rect
          x={mass.x}
          y={mass.y}
          width={mass.w}
          height={mass.h}
          fill="none"
          className="stroke-ink/70"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Level numbers of the non-residential storeys (not selectable). */}
      {geom.floors
        .filter((f) => !f.residential)
        .map((f) => (
          <text
            key={f.floor}
            aria-hidden="true"
            x={geom.labelX}
            y={f.band.y + f.band.h / 2}
            dominantBaseline="central"
            textAnchor="end"
            fontSize={fsLevel}
            className="invf-fade tabular fill-muted"
          >
            {f.floor}
          </text>
        ))}

      {/* Selectable storeys, on top of the drawing. */}
      {geom.floors
        .filter((f) => f.residential)
        .map((f) => {
          const s: AvailabilityStats | undefined = floorStats[f.floor];
          if (!s) return null;
          const active = activeFloor === f.floor;
          const cy = f.band.y + f.band.h / 2;
          return (
            <g
              key={f.floor}
              role="button"
              tabIndex={0}
              aria-label={floorAria(t, f.floor, s, locale)}
              data-floor={f.floor}
              // The site-wide :focus-visible outline would be drawn in SVG user
              // units (metres) — the accent contour is the focus mark instead.
              className="group cursor-pointer outline-none focus-visible:[outline:none]"
              onPointerEnter={(e) => canHover(e.pointerType) && onHoverFloor?.(f.floor)}
              onPointerLeave={(e) => canHover(e.pointerType) && onHoverFloor?.(null)}
              // Keyboard focus only: a tap focuses the band too, and must not
              // leave the storey lit (or the tag open) after the bar closes.
              onFocus={(e) => isFocusVisible(e.currentTarget) && onHoverFloor?.(f.floor)}
              onBlur={() => onHoverFloor?.(null)}
              onClick={() => onSelectFloor(f.floor)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFloor(f.floor);
                }
              }}
            >
              <rect x={geom.hitX0} y={f.band.y} width={geom.hitX1 - geom.hitX0} height={f.band.h} fill="transparent" />
              <rect
                x={f.band.x}
                y={f.band.y}
                width={f.band.w}
                height={f.band.h}
                className={cn(
                  'transition-[fill] duration-300 ease-premium',
                  // Hover tint only where hover is real (a tap's sticky
                  // :hover would keep the storey lit on a touch screen).
                  active ? 'fill-accent/20' : 'fill-accent/0 [@media(hover:hover)]:group-hover:fill-accent/10',
                )}
              />
              <rect
                x={f.band.x}
                y={f.band.y}
                width={f.band.w}
                height={f.band.h}
                fill="none"
                className={cn(
                  'stroke-accent transition-opacity duration-300 ease-premium',
                  active ? 'opacity-100' : 'opacity-0 group-focus-visible:opacity-100',
                )}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              {/* Level tick beside the number, and the leader to the side tag. */}
              <line
                x1={geom.labelX + 0.3}
                x2={f.band.x - 0.2}
                y1={cy}
                y2={cy}
                className={cn('stroke-accent transition-opacity duration-300', active ? 'opacity-100' : 'opacity-0')}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              {geom.kind === 'long' && (
                <line
                  x1={f.band.x + f.band.w}
                  x2={geom.tagX - 0.15}
                  y1={cy}
                  y2={cy}
                  className={cn('stroke-accent transition-opacity duration-300', active ? 'opacity-100' : 'opacity-0')}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <text
                x={geom.labelX}
                y={cy}
                dominantBaseline="central"
                textAnchor="end"
                fontSize={fsLevel}
                className={cn(
                  'invf-fade tabular transition-[fill] duration-300',
                  // Sold-out storeys keep full muted (AA): the dimmed drawing
                  // and the list already say "nothing free".
                  active ? 'fill-ink' : 'fill-muted [@media(hover:hover)]:group-hover:fill-ink',
                )}
                style={delay(500 + (f.floor / n) * 500)}
              >
                {f.floor}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

/**
 * The side tag of the long façade, in its own fixed column right of the
 * drawing (the storey's leader line runs to the column's edge), gliding
 * between storeys. It keeps the last storey while fading out so it never
 * jumps to the top on leave. The count never breaks: "7 квартир",
 * "7 apartamente" stay on one line at every width the tag is shown.
 */
function FacadeTag({
  geom,
  activeFloor,
  floorStats,
  t,
  common,
  locale,
}: Facade2DProps & { geom: FacadeGeometry }) {
  const [shown, setShown] = useState<number | null>(null);
  if (activeFloor != null && activeFloor !== shown) setShown(activeFloor);

  const f = shown != null ? geom.floors.find((x) => x.floor === shown) : undefined;
  const s = shown != null ? floorStats[shown] : undefined;
  if (!f || !s) return null;

  const { view } = geom;
  const cy = f.band.y + f.band.h / 2;
  const visible = activeFloor != null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 -translate-y-1/2 pl-3 transition-[top,opacity] duration-500 ease-premium',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ top: `${((cy - view.y) / view.h) * 100}%` }}
    >
      <p className="label whitespace-nowrap text-ink">
        {common.floor} {shown}
      </p>
      {s.available > 0 ? (
        <>
          <p className="mt-2.5 text-sm text-muted">{common.available}</p>
          <p className="mt-0.5 whitespace-nowrap font-display text-lead font-light leading-tight text-ink xl:text-display-sm">
            {counted(t.apartmentsForms, s.available, locale)}
          </p>
        </>
      ) : (
        <p className="mt-2.5 text-sm leading-snug text-muted">{t.noneAvailable}</p>
      )}
      {s.priceFrom !== null && (
        <p className="mt-1.5 whitespace-nowrap text-sm tabular text-muted">
          {common.from} {formatEUR(s.priceFrom, locale)}
        </p>
      )}
    </div>
  );
}
