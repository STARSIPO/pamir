'use client';

import { useId, useMemo } from 'react';
import type { FloorViewProps } from '../viewer/types';
import type { ApartmentStatus, Vec2 } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';
import { formatArea } from '../format';
import { FloorMotionStyles, delay } from './FloorMotion';
import { canHover, isFocusVisible } from './FloorPointer';
import { apartmentAria, fill, type CommonDict, type FloorsDict } from './FloorFormat';
import { useDrawingScale } from './FloorScale';
import {
  buildZones,
  coreParts,
  facadeViews,
  insetPolygon,
  isOutdoor,
  planFrame,
  toPath,
  type PlanFrame,
  type PlanOrientation,
  type Rect,
  type Zone,
} from './FloorPlanGeometry';

export interface FloorPlan2DProps extends FloorViewProps {
  t: FloorsDict;
  common: CommonDict;
  className?: string;
}

/**
 * Step 3 — one floor as an architectural plan (implements FloorViewProps; a
 * 3D floor scene can replace it with the same props).
 *
 * Drawn from the FloorPlate and each apartment's own plan: exterior walls,
 * party walls, window openings, the corridor, the stair-and-lift core with a
 * hatch, and every apartment's rooms faintly inside its zone. Zones carry the
 * status language of docs/INVENTORY.md — available: accent wash and a fine
 * accent line just inside the walls; reserved: ink hatch; sold: no wash,
 * muted text, not selectable — with the number and area set in the main room
 * on a halo of the zone's own tone, so partitions never cut through them.
 * North mark, scale bar and façade sides frame it.
 *
 * Landscape (north up) from md, portrait below it. Type is sized in metres so
 * the plan scales as one drawing, with an on-screen floor so captions never
 * drop below ~10–11 px however small the drawing gets.
 *
 * The plan draws in on load: walls trace, zones settle in one after another.
 */
export function FloorPlan2D(props: FloorPlan2DProps) {
  const { plate, apartments, className } = props;
  const zones = useMemo(() => buildZones(plate, apartments), [plate, apartments]);
  return (
    <div className={cn('relative', className)}>
      <FloorMotionStyles />
      <PlanSvg {...props} zones={zones} orientation="landscape" className="hidden md:block" />
      <PlanSvg {...props} zones={zones} orientation="portrait" className="mx-auto max-w-[26rem] md:hidden" />
    </div>
  );
}

/**
 * Status colours [rest, active]. Available is the only zone with a tint (and
 * the accent line, see below); sold has no wash at all, so the two never read
 * alike, whatever the theme's accent.
 */
const zoneFill: Record<ApartmentStatus, [string, string]> = {
  available: ['fill-accent/20', 'fill-accent/35'],
  reserved: ['fill-ink/5', 'fill-ink/10'],
  sold: ['fill-transparent', 'fill-ink/5'],
};
/**
 * The same tones for the label halo [token, rest %, active %], mixed into one
 * opaque colour over the canvas — so overlapping glyph halos never double up
 * into blots and leave no seam. Without color-mix() support the halo simply
 * drops out.
 */
const zoneHalo: Record<ApartmentStatus, [string, number, number]> = {
  available: ['--accent', 20, 35],
  reserved: ['--ink', 5, 10],
  sold: ['--ink', 0, 5],
};
const haloTone = ([token, rest, act]: [string, number, number], on: boolean) =>
  `color-mix(in srgb, rgb(var(${token})) ${on ? act : rest}%, rgb(var(--canvas)))`;
const zoneStroke: Record<ApartmentStatus, string> = {
  available: 'stroke-accent-strong',
  reserved: 'stroke-ink/30',
  sold: 'stroke-line/15',
};

/** On-screen floors for the metre-based type (px). */
const MIN_PX = { no: 18, meta: 11, status: 10, label: 10 };
/** Inset of the status line from the zone outline: clear of every wall. */
const INSET = 0.24;

function PlanSvg({
  zones,
  orientation,
  className,
  inventory,
  building,
  plate,
  floor,
  locale,
  activeApartmentId,
  onHoverApartment,
  onSelectApartment,
  t,
  common,
}: FloorPlan2DProps & { zones: Zone[]; orientation: PlanOrientation }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const frame = useMemo(() => planFrame(plate, orientation), [plate, orientation]);
  const { view } = frame;
  const path = (poly: Vec2[], close = true) => toPath(poly.map(frame.pt), close);
  const box = (r: Rect) => frame.rect(r);
  const [W, H] = plate.size;
  const portrait = orientation === 'portrait';
  const core = coreParts(plate.core);
  const sides = facadeViews(plate);
  const active = zones.find((z) => z.apartment.id === activeApartmentId);
  const insets = useMemo(
    () => new Map(zones.map((z) => [z.apartment.id, toPath(insetPolygon(z.outline, INSET).map(frame.pt))])),
    [zones, frame],
  );

  const { ref: svgRef, atLeast } = useDrawingScale(view.w);

  // Type sizes in metres: the plan scales as one drawing, never below MIN_PX.
  const fsNo = atLeast(portrait ? 1.75 : 1.45, MIN_PX.no);
  const fsMeta = atLeast(portrait ? 0.74 : 0.6, MIN_PX.meta);
  const fsStatus = atLeast(fsMeta * 0.86, MIN_PX.status);
  const fsLabel = atLeast(portrait ? 0.56 : 0.46, MIN_PX.label);
  // Label halo: ~2.5 px of the zone's own tone either side of each glyph.
  const halo = atLeast(0.25, 5);

  const corridor = box(plate.corridor);
  const coreBox = box(plate.core);

  return (
    <svg
      ref={svgRef}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      className={cn('block h-auto w-full touch-manipulation select-none', className)}
      role="group"
      aria-label={fill(t.planAria, { building: building.name[locale], floor })}
    >
      <defs>
        <pattern id={`${uid}-res`} patternUnits="userSpaceOnUse" width="0.5" height="0.5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.5" className="stroke-ink/25" strokeWidth="0.07" />
        </pattern>
        <pattern id={`${uid}-core`} patternUnits="userSpaceOnUse" width="0.3" height="0.3" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="0.3" className="stroke-ink/30" strokeWidth="0.035" />
        </pattern>
      </defs>

      {/* Circulation: corridor and the stair/lift core (hatch = structure). */}
      <g aria-hidden="true" className="invf-fade pointer-events-none" style={delay(120)}>
        <rect x={corridor.x} y={corridor.y} width={corridor.w} height={corridor.h} className="fill-ink/[0.035]" />
        <rect x={coreBox.x} y={coreBox.y} width={coreBox.w} height={coreBox.h} fill={`url(#${uid}-core)`} />
        {[core.stair, core.lift, core.lobby, core.liftLobby].map((r, i) => {
          const b = box(r);
          return <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} className="fill-canvas" />;
        })}
        {[core.stair, core.lift].map((r, i) => {
          const b = box(r);
          return (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="none"
              className="stroke-ink/40"
              strokeWidth={0.75}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {[...core.treads, core.divider].map(([a, b], i) => (
          <path
            key={i}
            d={path([a, b], false)}
            className="stroke-ink/30"
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {(() => {
          const l = core.lift;
          return (
            <path
              d={
                path([[l.x, l.y], [l.x + l.w, l.y + l.h]], false) +
                path([[l.x + l.w, l.y], [l.x, l.y + l.h]], false)
              }
              className="stroke-ink/30"
              strokeWidth={0.75}
              vectorEffect="non-scaling-stroke"
            />
          );
        })()}
        <PlanLabel
          at={frame.pt([plate.corridor.x + plate.corridor.w / 2, plate.corridor.y + plate.corridor.h / 2])}
          size={fsLabel}
          rotate={portrait ? 90 : 0}
          className="fill-muted"
        >
          {t.corridor}
        </PlanLabel>
      </g>

      {/* Apartments. */}
      {zones.map((z, i) => {
        const a = z.apartment;
        const on = a.id === activeApartmentId;
        const sold = a.status === 'sold';
        const available = a.status === 'available';
        const d = path(z.outline);
        const areaText = `${formatArea(a.area, locale)} ${common.sqm}`;
        const thirdText = sold ? common.status.sold : `${a.rooms} ${common.roomsShort}`;
        // Keep the text block inside the slot along the corridor, clear of the
        // status line: in landscape by the widest caption (estimated at its
        // on-screen size), in portrait by the block's height (three lines).
        const r = z.slot.rect;
        const wide = Math.max(
          a.number.length * fsNo * 0.56,
          areaText.length * fsMeta * 0.58,
          thirdText.length * fsStatus * 0.72,
        );
        const half = Math.min(portrait ? 2.2 : Math.max(1.5, wide / 2 + INSET + 0.4), r.w / 2);
        const [lx, ly] = frame.pt([Math.min(Math.max(z.label[0], r.x + half), r.x + r.w - half), z.label[1]]);
        const hover = (e: React.PointerEvent, id: string | null) => {
          if (canHover(e.pointerType)) onHoverApartment?.(id);
        };
        // Number, area, rooms (or "sold"): drawn twice — a halo in the zone's
        // own tone, then the text — so room partitions and the reserved hatch
        // stop short of every glyph.
        const lines = [
          {
            y: ly - fsMeta * 0.9,
            size: fsNo,
            text: a.number,
            base: 'font-display font-light tabular',
            ink: sold ? 'fill-muted' : available ? 'fill-ink' : 'fill-ink/70',
          },
          {
            y: ly + fsMeta * 0.95,
            size: fsMeta,
            text: areaText,
            base: 'tabular',
            ink: sold ? 'fill-muted' : available ? (on ? 'fill-ink' : 'fill-ink/75') : 'fill-muted',
          },
          {
            y: ly + fsMeta * 0.95 + fsStatus * 1.62,
            size: fsStatus,
            spacing: fsStatus * 0.1,
            text: thirdText,
            base: 'uppercase',
            ink: sold ? 'fill-muted' : available ? (on ? 'fill-ink' : 'fill-ink/75') : 'fill-muted',
          },
        ];
        const label = (paint: 'halo' | 'ink') =>
          lines.map((l, n) => (
            <text
              key={n}
              x={lx}
              y={l.y}
              fontSize={l.size}
              letterSpacing={l.spacing}
              {...(paint === 'ink'
                ? { className: cn(l.base, l.ink, 'transition-[fill] duration-300 ease-premium') }
                : {
                    fill: 'none',
                    // Wide enough to close the gaps between glyphs too, so no
                    // hatch or partition shows through a word.
                    strokeWidth: Math.max(halo, l.size * 0.32),
                    strokeLinejoin: 'round' as const,
                    className: cn(l.base, 'transition-[stroke] duration-300 ease-premium'),
                    style: { stroke: haloTone(zoneHalo[a.status], on) },
                  })}
            >
              {l.text}
            </text>
          ));
        return (
          <g
            key={a.id}
            data-apartment={a.id}
            {...(sold
              ? { 'aria-hidden': true }
              : {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': apartmentAria(t, common, a, locale),
                  // Keyboard focus only: a tap focuses the zone too, and must
                  // not open the hover card (no pointer position on touch).
                  onFocus: (e: React.FocusEvent<SVGGElement>) => {
                    if (isFocusVisible(e.currentTarget)) onHoverApartment?.(a.id);
                  },
                  onBlur: () => onHoverApartment?.(null),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectApartment(a.id);
                    }
                  },
                })}
            onPointerEnter={(e) => hover(e, a.id)}
            onPointerLeave={(e) => hover(e, null)}
            onClick={() => onSelectApartment(a.id)}
            // No site-wide outline here (it would be drawn in metres): the
            // zone's inner contour above the walls is the focus mark.
            className={cn(
              'invf-fade group outline-none focus-visible:[outline:none]',
              sold ? 'cursor-default' : 'cursor-pointer',
            )}
            style={delay(220 + i * 45)}
          >
            <path d={d} className={cn('transition-[fill] duration-300 ease-premium', zoneFill[a.status][on ? 1 : 0])} />
            {a.status === 'reserved' && <path d={d} fill={`url(#${uid}-res)`} className="pointer-events-none" />}
            <g className="pointer-events-none">
              {z.rooms.map((rm) => (
                <path
                  key={rm.id}
                  d={path(rm.poly)}
                  fill="none"
                  className={cn(isOutdoor(rm.type) ? 'stroke-ink/25' : sold ? 'stroke-ink/10' : 'stroke-ink/20')}
                  strokeWidth={0.75}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path
                d={path(z.door, false)}
                fill="none"
                className="stroke-ink/25"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <path
              d={d}
              fill="none"
              className={cn('pointer-events-none', zoneStroke[a.status])}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <g className="pointer-events-none" textAnchor="middle">
              {label('halo')}
              {label('ink')}
            </g>
          </g>
        );
      })}

      {/* Walls on top: party walls, core, then the exterior contour tracing in. */}
      <g aria-hidden="true" className="pointer-events-none">
        <g className="invf-fade" style={delay(200)}>
          {zones.map((z) => {
            const r = box(z.slot.rect);
            return (
              <rect key={z.slot.id} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" className="stroke-ink/55" strokeWidth={0.12} />
            );
          })}
          <rect x={coreBox.x} y={coreBox.y} width={coreBox.w} height={coreBox.h} fill="none" className="stroke-ink/60" strokeWidth={0.16} />
        </g>
        <path
          d={path([
            [0, 0],
            [W, 0],
            [W, H],
            [0, H],
          ])}
          pathLength={1}
          fill="none"
          className="invf-draw stroke-ink/85"
          strokeWidth={0.24}
          strokeLinejoin="miter"
        />
        {/* Window openings cut the façade wall. */}
        <g className="invf-fade" style={delay(700)}>
          {zones.flatMap((z) =>
            z.windows.map((w, k2) => {
              const [ax, ay] = frame.pt(w.a);
              const [bx, by] = frame.pt(w.b);
              const horizontal = Math.abs(ay - by) < 1e-6;
              const t2 = 0.16;
              const x = Math.min(ax, bx) - (horizontal ? 0 : t2);
              const y = Math.min(ay, by) - (horizontal ? t2 : 0);
              const wv = horizontal ? Math.abs(ax - bx) : t2 * 2;
              const hv = horizontal ? t2 * 2 : Math.abs(ay - by);
              return (
                <g key={`${z.slot.id}-${k2}`}>
                  <rect x={x} y={y} width={wv} height={hv} className="fill-canvas" />
                  <path
                    d={`M${ax} ${ay}L${bx} ${by}`}
                    className="stroke-ink/45"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={wv}
                    height={hv}
                    fill="none"
                    className="stroke-ink/40"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            }),
          )}
        </g>
      </g>

      {/* Available apartments keep a fine accent line just inside their walls
          (accent-strong: ≥ 3:1 on the wash in every theme); the active one a
          firmer line — both above the walls, never on them. */}
      <g aria-hidden="true" className="invf-fade pointer-events-none" style={delay(650)}>
        {zones
          .filter((z) => z.apartment.status === 'available' && z !== active)
          .map((z) => (
            <path
              key={z.apartment.id}
              d={insets.get(z.apartment.id)}
              fill="none"
              className="stroke-accent-strong"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </g>
      {active && (
        <path
          d={insets.get(active.apartment.id)}
          fill="none"
          aria-hidden="true"
          className={cn(
            'pointer-events-none',
            active.apartment.status === 'available' ? 'stroke-accent-strong' : 'stroke-ink/70',
          )}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Context: façade sides, north mark, scale bar. */}
      <g aria-hidden="true" className="invf-fade pointer-events-none" style={delay(800)}>
        {(['north', 'south'] as const).map((side) => {
          const v = sides[side];
          if (!v) return null;
          const off = 3.7;
          const p = frame.pt([W / 2, side === 'north' ? -off : H + off]);
          if (portrait) {
            const q = frame.pt([W / 2, side === 'north' ? -3.1 : H + 3.1]);
            return (
              <PlanLabel key={side} at={q} size={fsLabel} rotate={side === 'north' ? 90 : -90} className="fill-muted">
                {v === 'courtyard' ? t.courtyard : t.street}
              </PlanLabel>
            );
          }
          return (
            <g key={side}>
              <PlanLabel at={p} size={fsLabel * 1.15} className="fill-muted">
                {v === 'courtyard' ? t.courtyard : t.street}
              </PlanLabel>
              <path
                d={`M${p[0] - 6} ${p[1]}H${p[0] - 2.2}M${p[0] + 2.2} ${p[1]}H${p[0] + 6}`}
                className="stroke-ink/20"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        <NorthMark
          frame={frame}
          north={inventory.site.north}
          label={t.north}
          size={fsLabel}
          at={[view.x + view.w - 1.5, view.y + 1.55]}
        />
        <ScaleBar at={[view.x + (portrait ? 1.0 : 1.6), view.y + view.h - (portrait ? 1.0 : 1.3)]} unit={t.metre} size={fsLabel} />
      </g>
    </svg>
  );
}

function PlanLabel({
  at,
  size,
  rotate = 0,
  className,
  children,
}: {
  at: Vec2;
  size: number;
  rotate?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <text
      x={at[0]}
      y={at[1]}
      fontSize={size}
      letterSpacing={size * 0.16}
      textAnchor="middle"
      dominantBaseline="central"
      transform={rotate ? `rotate(${rotate} ${at[0]} ${at[1]})` : undefined}
      className={cn('uppercase', className)}
    >
      {children}
    </text>
  );
}

/** A thin needle in a hairline circle, turned with the drawing. */
function NorthMark({ frame, north, label, size, at }: { frame: PlanFrame; north: number; label: string; size: number; at: Vec2 }) {
  const r = 0.8;
  const angle = frame.rotation + north;
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
      <circle r={r} fill="none" className="stroke-ink/30" strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <path d={`M0 ${-r * 0.8}L${r * 0.26} ${r * 0.45}L0 ${r * 0.2}L${-r * 0.26} ${r * 0.45}Z`} className="fill-ink/70" />
      <text
        y={-r - size * 0.9}
        fontSize={size}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(${-angle} 0 ${-r - size * 0.9})`}
        className="fill-muted"
      >
        {label}
      </text>
    </g>
  );
}

/** 0 — 5 m in two alternating halves. */
function ScaleBar({ at, unit, size }: { at: Vec2; unit: string; size: number }) {
  const [x, y] = at;
  const h = 0.16;
  return (
    <g>
      <rect x={x} y={y - h} width={2.5} height={h} className="fill-ink/60" />
      <rect x={x + 2.5} y={y - h} width={2.5} height={h} fill="none" className="stroke-ink/60" strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
      <text x={x} y={y - h - size * 0.9} fontSize={size} className="tabular fill-muted">
        0
      </text>
      <text x={x + 5} y={y - h - size * 0.9} fontSize={size} textAnchor="middle" className="tabular fill-muted">
        5 {unit}
      </text>
    </g>
  );
}
