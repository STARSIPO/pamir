'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import type { ApartmentViewProps } from '@/components/inventory/viewer/types';
import type { RoomType } from '@/lib/inventory/types';
import { formatArea } from '@/lib/pricing/engine';
import { cn } from '@/lib/utils';
import {
  PARTITION,
  WALL,
  isWet,
  labelSpot,
  openingCut,
  openingLines,
  planGeometry,
  type CornerSide,
  type PlanGeometry,
  type PlanRoom,
} from './geometry';
import { fill, pad2 } from './text';
import styles from './plan.module.css';

/** Strings the drawing needs, pre-sliced from the dictionary (kept small: this is a client component). */
export interface PlanLabels {
  room: Record<RoomType, string>;
  /** '{name} — {area} м²' */
  roomTpl: string;
  /** Accessible name of the whole drawing, already filled. */
  planAria: string;
  entrance: string;
  facade: string;
  /** "Окна во двор" — what the façade looks onto, if known. */
  outlook: string | null;
  north: string;
  northAria: string;
  metre: string;
  scaleAria: string;
  hintHover: string;
  hintTouch: string;
}

export interface PlanOrientationProps {
  northDeg: number;
  cornerSide: CornerSide;
}

/**
 * 2D implementation of the apartment view contract (ApartmentViewProps). A
 * future ApartmentScene3D takes the same props — `activeRoomId`,
 * `onHoverRoom`, `pinnedRoomId`, `onSelectRoom` — and the extras below, so
 * the page swaps viewers without touching selection state.
 */
export type ApartmentPlan2DProps = ApartmentViewProps & {
  labels: PlanLabels;
  orientation: PlanOrientationProps;
  /** Tallest the drawing may get; it narrows to keep its proportions. */
  maxHeight?: string;
  className?: string;
};

/**
 * Label type sizes (px) on a wide drawing and on a phone-width one. Room
 * names are always the site's `.label` (0.72rem); only the area steps down.
 */
const FONT = { wide: { name: 11.5, area: 17 }, compact: { name: 11.5, area: 14 } };

/** Position of a plan point inside the drawing box, in % (for HTML overlays). */
const at = (g: PlanGeometry, x: number, y: number): CSSProperties => ({
  left: `${((x - g.view.x) / g.view.w) * 100}%`,
  top: `${((y - g.view.y) / g.view.h) * 100}%`,
});

/**
 * The apartment plan as an architectural drawing: exterior walls to scale,
 * thin partitions with a door into every room, windows cut into the façade
 * (a glazed door where a balcony sits in front), the entrance door with its
 * swing, hatched balcony/terrace, tiled wet rooms. It draws itself in on
 * mount (plan.module.css); hovering or focusing a room lays a soft accent
 * wash on it, and its label steps up to ink; a pinned room keeps a thin
 * accent frame while another is looked at. Labels are HTML over the SVG, so
 * they stay at reading size whatever the drawing's scale — and step down
 * (name → area → number) when a room is too small for them on a phone, or
 * move aside to clear a door swing. Under the drawing: the active room in
 * words, a scale bar and the north arrow.
 */
export function ApartmentPlan2D({
  apartment,
  locale,
  activeRoomId = null,
  onHoverRoom,
  pinnedRoomId = null,
  onSelectRoom,
  labels,
  orientation,
  maxHeight = 'min(58svh, 36rem)',
  className,
}: ApartmentPlan2DProps) {
  const plan = apartment.plan2D;
  const g = useMemo(() => planGeometry(plan, orientation.cornerSide), [plan, orientation.cornerSide]);
  const v = g.view;

  // SVG ids must be unique per instance and safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hatchId = `apt-hatch-${uid}`;
  const tileId = `apt-tile-${uid}`;
  const cutId = `apt-cut-${uid}`;
  const clipId = (roomId: string) => `apt-clip-${uid}-${roomId}`;

  // Drawing scale in px per metre, measured (labels, scale bar). Null until
  // the first measurement: labels mount then, with their own fade-in.
  const boxRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setK(width / v.w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [v.w]);

  // Keyboard focus shows a stronger inner accent frame; pointer focus does not.
  const [focusRing, setFocusRing] = useState<string | null>(null);

  const areaOf = (r: PlanRoom) => formatArea(r.room.area, locale);
  const roomText = (r: PlanRoom) => fill(labels.roomTpl, { name: labels.room[r.room.type], area: areaOf(r) });

  const hoverFromPointer = (e: PointerEvent, id: string | null) => {
    if (e.pointerType === 'touch') return;
    onHoverRoom?.(id);
  };
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRoom?.(id);
    }
  };

  const active = activeRoomId ? g.rooms.find((r) => r.room.id === activeRoomId) : undefined;
  const compact = k !== null && k * v.w < 560;
  const facadeText = labels.outlook ? `${labels.facade} · ${labels.outlook}` : labels.facade;

  const drawing = (
    <svg
      viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}
      className="absolute inset-0 h-full w-full overflow-visible"
      role="group"
      aria-label={labels.planAria}
    >
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="0.26" height="0.26" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.26" className="stroke-ink/25" strokeWidth="0.03" />
        </pattern>
        <pattern id={tileId} patternUnits="userSpaceOnUse" width="0.3" height="0.3">
          <path d="M0.3 0V0.3H0" className="fill-none stroke-ink/[0.09]" strokeWidth="0.014" />
        </pattern>
        {g.rooms.map((r) => (
          <clipPath key={r.room.id} id={clipId(r.room.id)}>
            <path d={r.path} />
          </clipPath>
        ))}
        {/* Door openings, taken out of the partitions (a luminance mask:
            white keeps, black cuts — not colours of the drawing). */}
        <mask id={cutId} maskUnits="userSpaceOnUse" x={v.x} y={v.y} width={v.w} height={v.h}>
          <rect x={v.x} y={v.y} width={v.w} height={v.h} fill="white" />
          {g.doors.map((d, i) =>
            d.cut ? (
              <rect key={i} x={d.cut.x0} y={d.cut.y0} width={d.cut.x1 - d.cut.x0} height={d.cut.y1 - d.cut.y0} fill="black" />
            ) : null,
          )}
        </mask>
      </defs>

      {/* Floor finishes: hatched outdoor space, tiled wet rooms. */}
      <g aria-hidden="true" className="pointer-events-none">
        {g.rooms.map((r, i) =>
          r.outdoor || isWet(r.room.type) ? (
            <path
              key={r.room.id}
              d={r.path}
              fill={`url(#${r.outdoor ? hatchId : tileId})`}
              className={styles.room}
              style={{ '--i': i } as CSSProperties}
            />
          ) : null,
        )}
      </g>

      {/* Rooms — the interactive layer, under the walls. */}
      <g>
        {g.rooms.map((r) => {
          const id = r.room.id;
          return (
            <path
              key={id}
              d={r.path}
              tabIndex={0}
              role="button"
              aria-pressed={pinnedRoomId === id}
              aria-label={`${pad2(r.index)} · ${roomText(r)}`}
              className={cn(
                // The room's own inner accent frame is its focus ring: the
                // site-wide :focus-visible outline does not draw well on SVG.
                'cursor-pointer outline-none transition-colors duration-300 ease-premium focus-visible:outline-none',
                activeRoomId === id ? (pinnedRoomId === id ? 'fill-accent/20' : 'fill-accent/[0.14]') : 'fill-accent/0',
              )}
              onPointerEnter={(e) => hoverFromPointer(e, id)}
              onPointerLeave={(e) => hoverFromPointer(e, null)}
              onClick={() => onSelectRoom?.(id)}
              onKeyDown={(e) => onKey(e, id)}
              onFocus={(e) => {
                if (!e.currentTarget.matches(':focus-visible')) return;
                setFocusRing(id);
                onHoverRoom?.(id);
              }}
              onBlur={() => {
                if (focusRing !== id) return;
                setFocusRing(null);
                onHoverRoom?.(null);
              }}
            />
          );
        })}
      </g>

      {/* Partitions, drawn in room by room, open at the doors. */}
      <g aria-hidden="true" mask={`url(#${cutId})`} className="pointer-events-none fill-none">
        {g.rooms.map((r, i) => (
          <path
            key={r.room.id}
            d={r.path}
            pathLength={1}
            strokeWidth={r.outdoor ? 0.035 : PARTITION}
            className={cn(styles.partition, r.outdoor ? 'stroke-ink/55' : 'stroke-ink/70')}
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>

      {/* Exterior walls, to scale, drawn round the outline. */}
      <path
        aria-hidden="true"
        d={g.outline}
        pathLength={1}
        strokeWidth={WALL}
        strokeLinejoin="miter"
        strokeLinecap="square"
        className={cn(styles.wall, 'pointer-events-none fill-none stroke-ink')}
      />

      {/* Windows and the entrance cut into the wall; every door drawn open. */}
      <g aria-hidden="true" className={cn(styles.openings, 'pointer-events-none')}>
        {g.windows.map((o, i) => {
          const c = openingCut(o);
          return (
            <g key={i}>
              <rect x={c.x0} y={c.y0} width={c.x1 - c.x0} height={c.y1 - c.y0} className="fill-surface" />
              <path d={openingLines(o)} vectorEffect="non-scaling-stroke" strokeWidth={1} className="fill-none stroke-ink/80" />
            </g>
          );
        })}
        {g.door && (
          <>
            <rect
              x={g.door.cut.x0}
              y={g.door.cut.y0}
              width={g.door.cut.x1 - g.door.cut.x0}
              height={g.door.cut.y1 - g.door.cut.y0}
              className="fill-surface"
            />
            <path d={g.door.leaf} vectorEffect="non-scaling-stroke" strokeWidth={1.5} className="fill-none stroke-ink" />
            <path d={g.door.arc} vectorEffect="non-scaling-stroke" strokeWidth={1} className="fill-none stroke-ink/40" />
          </>
        )}
        {g.doors.map((d, i) => (
          <g key={i}>
            <path d={d.leaf} vectorEffect="non-scaling-stroke" strokeWidth={1.25} className="fill-none stroke-ink/80" />
            <path d={d.arc} vectorEffect="non-scaling-stroke" strokeWidth={1} className="fill-none stroke-ink/35" />
          </g>
        ))}
      </g>

      {/* Inner accent frame of the active room, above the walls (clipped to
          the room, so only the inside half of the stroke shows; open at the
          doors like the partitions). A pinned room keeps a thinner frame
          while another room is hovered or focused. */}
      <g aria-hidden="true" mask={`url(#${cutId})`} className="pointer-events-none">
        {g.rooms.map((r) => {
          const id = r.room.id;
          const on = activeRoomId === id;
          const pin = pinnedRoomId === id;
          return (
            <path
              key={id}
              d={r.path}
              clipPath={`url(#${clipId(id)})`}
              strokeWidth={focusRing === id ? 0.16 : on ? 0.1 : 0.06}
              className={cn(
                'fill-none stroke-accent transition-opacity duration-300 ease-premium',
                on ? 'opacity-100' : pin ? 'opacity-70' : 'opacity-0',
              )}
            />
          );
        })}
      </g>
    </svg>
  );

  // Room labels at reading size, over the drawing.
  const roomLabels = k !== null && (
    <div aria-hidden="true" className={cn(styles.labels, 'pointer-events-none absolute inset-0')}>
      {g.rooms.map((r) => {
        const name = labels.room[r.room.type];
        const area = `${areaOf(r)} ${labels.metre}²`;
        const { mode, center } = labelSpot(r, k, name, area, compact ? FONT.compact : FONT.wide);
        if (mode === 'none') return null;
        const on = activeRoomId === r.room.id;
        return (
          <span
            key={r.room.id}
            className={cn(
              'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap text-center',
              // Over hatching the label gets a patch of the plate's own tone.
              r.outdoor && 'bg-surface/85 px-1.5 py-1',
            )}
            style={at(g, center[0], center[1])}
          >
            {mode === 'full' && (
              <span
                className={cn('label transition-colors duration-300 ease-premium', on ? 'text-ink' : 'text-muted')}
              >
                {name}
              </span>
            )}
            {(mode === 'full' || mode === 'area') && (
              <span
                className={cn(
                  'font-display font-light tabular leading-none text-ink',
                  mode === 'full' && 'mt-1.5',
                  compact ? 'text-[0.875rem]' : 'text-[1.0625rem]',
                )}
              >
                {area}
              </span>
            )}
            {mode === 'index' && (
              <span className={cn('label tabular transition-colors duration-300', on ? 'text-ink' : 'text-muted')}>
                {pad2(r.index)}
              </span>
            )}
          </span>
        );
      })}
      {g.door && k * 0.9 >= 16 && (
        <span
          className="label absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-muted"
          style={at(g, g.door.label[0], g.door.label[1])}
        >
          {labels.entrance}
        </span>
      )}
    </div>
  );

  return (
    <figure className={className}>
      {/* The drawing keeps its proportions: full width, or narrower when a
          deep plan would otherwise run taller than `maxHeight`. */}
      <div className="mx-auto" style={{ width: `min(100%, calc(${maxHeight} * ${(v.w / v.h).toFixed(4)}))` }}>
        {/* The façade side, named: the plan is always drawn façade-up. */}
        <div aria-hidden="true" className="mb-3 flex items-center gap-3 md:mb-4">
          <span className="h-px min-w-6 flex-1 bg-line/15" />
          <span className="label shrink-0 text-muted">{facadeText}</span>
          <span className="h-px min-w-6 flex-1 bg-line/15" />
        </div>
        <div ref={boxRef} className="relative" style={{ aspectRatio: `${v.w} / ${v.h}` }}>
          {drawing}
          {roomLabels}
        </div>
      </div>

      <figcaption className="mt-5 flex items-start justify-between gap-6 border-t border-line/10 pt-4 md:mt-8">
        {/* The active room in words — the only way to read a small room's
            name on a phone, where its label shrinks to a number. */}
        <p aria-live="polite" className="min-h-11 min-w-0 flex-1 text-pretty text-sm leading-snug text-muted md:text-base">
          {active ? (
            <span className="text-ink">
              <span className="label mr-2 tabular text-muted">{pad2(active.index)}</span>
              {roomText(active)}
            </span>
          ) : (
            <>
              <span className="hidden [@media(hover:hover)]:inline">{labels.hintHover}</span>
              <span className="[@media(hover:hover)]:hidden">{labels.hintTouch}</span>
            </>
          )}
        </p>
        <div className="flex shrink-0 items-end gap-5 pt-1">
          {k !== null && <ScaleBar k={k} unit={labels.metre} aria={labels.scaleAria} />}
          <NorthArrow deg={orientation.northDeg} letter={labels.north} aria={labels.northAria} />
        </div>
      </figcaption>
    </figure>
  );
}

/**
 * Scale bar at the drawing's scale (`k` px per metre), two alternating
 * segments: 0 — 1 — 2 m, or 0 — 5 m when 2 m would be too short to label
 * (a wide plan on a phone).
 */
function ScaleBar({ k, unit, aria }: { k: number; unit: string; aria: string }) {
  const metres = 2 * k >= 48 ? 2 : 5;
  const px = metres * k;
  const half = px / 2;
  return (
    <div role="img" aria-label={fill(aria, { n: metres })} className="flex flex-col items-start gap-1.5">
      <div className="flex h-1.5 border border-ink/60" style={{ width: px }}>
        <span className="h-full bg-ink/60" style={{ width: half }} />
      </div>
      <div className="label relative h-3.5 tabular text-muted" style={{ width: px }}>
        <span className="absolute left-0 -translate-x-1/2">0</span>
        {metres === 2 && (
          <span className="absolute -translate-x-1/2" style={{ left: half }}>
            1
          </span>
        )}
        <span className="absolute right-0 translate-x-1/2 whitespace-nowrap">
          {metres} {unit}
        </span>
      </div>
    </div>
  );
}

/** Thin north arrow, turned to where north lies on this drawing. */
function NorthArrow({ deg, letter, aria }: { deg: number; letter: string; aria: string }) {
  return (
    <div role="img" aria-label={aria} className="flex flex-col items-center gap-1 text-muted">
      <span className="label">{letter}</span>
      <svg viewBox="0 0 24 24" className="h-6 w-6" style={{ transform: `rotate(${deg}deg)` }} aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
        <path d="M12 3.5 15 13H9Z" fill="currentColor" />
        <path d="M12 20.5V13" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
