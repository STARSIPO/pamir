import type { CSSProperties, HTMLAttributes, SVGProps } from 'react';
import type { Building, SiteFeature } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';
import { placeLabels, pts, type ComplexGeometry, type LabelType } from './ComplexGeometry';

export type FeatureType = SiteFeature['type'];

export interface ComplexDrawingLabels {
  /** Accessible name of the whole scheme. */
  scheme: string;
  /** Localised north letter for the north arrow. */
  north: string;
  features: Record<FeatureType, string>;
  /** Building id → display name ("Блок 3"). */
  names: Record<string, string>;
  /** Street name printed along the road. */
  street?: string;
}

/**
 * How the volumes arrive:
 *  play — they rise out of their footprints (CSS keyframes, staggered, ~900ms)
 *  wait — held below ground until the scheme scrolls into view
 *  none — drawn in place (static previews)
 */
export type RiseState = 'play' | 'wait' | 'none';

/*
 * Keyframes for the scheme. CSS only — no JS animation — so the global
 * prefers-reduced-motion rule and the block below stop it. Inline SVG styles
 * are document-wide, hence the `cx-` prefix.
 */
const CSS = `
.cx-svg path,.cx-svg polygon,.cx-svg rect,.cx-svg circle,.cx-svg line{vector-effect:non-scaling-stroke}
@keyframes cx-rise{from{transform:translateY(var(--cx-rise))}to{transform:translateY(0)}}
@keyframes cx-fade{from{opacity:0}to{opacity:1}}
.cx[data-rise=play] .cx-rise{animation:cx-rise .9s var(--ease-premium) both;animation-delay:calc(.2s + var(--cx-i) * .16s)}
.cx[data-rise=wait] .cx-rise{transform:translateY(var(--cx-rise))}
.cx[data-rise=play] .cx-ground{animation:cx-fade .8s var(--ease-premium) both}
.cx[data-rise=wait] .cx-ground{opacity:0}
.cx[data-rise=play] .cx-pin{animation:cx-fade .6s var(--ease-premium) both;animation-delay:calc(.9s + var(--cx-i) * .16s)}
.cx[data-rise=wait] .cx-pin{opacity:0}
.cx-swap{animation:cx-fade .45s var(--ease-premium) both}
.cx{--cx-halo:var(--canvas)}
.cx-halo{text-shadow:0 0 1px rgb(var(--cx-halo)),0 0 2px rgb(var(--cx-halo)),0 0 3px rgb(var(--cx-halo)),0 0 5px rgb(var(--cx-halo)),0 0 8px rgb(var(--cx-halo))}
@media (prefers-reduced-motion: reduce){.cx .cx-rise{animation:none!important;transform:none!important}.cx .cx-ground,.cx .cx-pin,.cx-swap{animation:none!important;opacity:1!important}}
`;

const hair = 'fill-none stroke-ink/25';

/**
 * The axonometric site scheme itself: ground plane linework, the building
 * volumes, and crisp HTML pins/labels laid over the SVG in % of its box.
 *
 * No hooks and no 'use client': it renders on the server for the static
 * preview (SelectorTeaser) and inside the interactive ComplexScheme2D, which
 * passes `zoneProps` to turn each volume into a keyboard-focusable button.
 */
export function ComplexDrawing({
  geometry,
  labels,
  idPrefix,
  activeId = null,
  selectedId = null,
  rise = 'none',
  zoneProps,
  pinProps,
  featureLabels = true,
  className,
}: {
  geometry: ComplexGeometry;
  labels: ComplexDrawingLabels;
  /** Unique per instance: clip-path ids. */
  idPrefix: string;
  /** Highlighted building (hover, focus or selection). Others dim slightly. */
  activeId?: string | null;
  selectedId?: string | null;
  rise?: RiseState;
  /** Makes each building an interactive zone (role, tabIndex, handlers). */
  zoneProps?: (b: Building) => SVGProps<SVGGElement>;
  /**
   * Makes each name pin a pointer target for the same building (the name is
   * what a finger goes for on a phone). Pointer only: the pins stay out of
   * the accessibility tree and the tab order — the volumes are the buttons.
   */
  pinProps?: (b: Building) => HTMLAttributes<HTMLSpanElement>;
  /** Names of courtyard, playground, parking… on the drawing (hidden below sm). */
  featureLabels?: boolean;
  className?: string;
}) {
  const { viewBox: vb, site, volumes } = geometry;
  const [W, D] = site.size;
  const interactive = !!zoneProps;

  const textOf = (type: LabelType) =>
    type === 'north' ? labels.north : type === 'road' ? (labels.street ?? labels.features.road) : labels.features[type];
  // A .label glyph is ~9.5px wide; the drawing is ~6.5px per unit where the
  // names show (sm and up). Only used to keep names off the volumes.
  const overlay = featureLabels ? placeLabels(geometry, (type) => (textOf(type).length * 9.5) / 6.5 / 2) : [];

  // Below sm the frame shows only the band holding the buildings (the inner
  // box keeps the full drawing and slides left), so the volumes are larger
  // under a finger. Pins may still rise above the frame: only x is clipped.
  const { crop } = geometry;
  const frame = {
    '--cx-ar': `${vb.w} / ${vb.h}`,
    '--cx-ar-m': `${crop.w} / ${vb.h}`,
    '--cx-w': `${Math.round((vb.w / crop.w) * 10000) / 100}%`,
    '--cx-l': `${Math.round((-(crop.x - vb.x) / crop.w) * 10000) / 100}%`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        'cx relative w-full overflow-x-clip [aspect-ratio:var(--cx-ar-m)] sm:overflow-x-visible sm:[aspect-ratio:var(--cx-ar)]',
        className,
      )}
      data-rise={rise}
      style={frame}
    >
      <div className="absolute inset-y-0 left-[var(--cx-l)] w-[var(--cx-w)] sm:left-0 sm:w-full">
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="cx-svg absolute inset-0 h-full w-full overflow-visible"
          role={interactive ? 'group' : 'img'}
          aria-label={labels.scheme}
        >
          <defs>
            <style>{CSS}</style>
            {rise !== 'none' &&
              volumes.map((vol) => (
                <clipPath key={vol.id} id={`${idPrefix}-clip-${vol.id}`}>
                  <polygon points={pts(vol.clip)} />
                </clipPath>
              ))}
          </defs>

          {/* Ground plane, drawn in plan metres through the axonometric matrix. */}
          <g className="cx-ground" aria-hidden="true">
            <g transform={geometry.ground}>
              <rect x={0} y={0} width={W} height={D} className="fill-ink/[0.018] stroke-ink/25" strokeDasharray="10 3 2 3" />
              {site.features.map((f, i) => (
                <Feature key={i} feature={f} />
              ))}
              <path d={site.stalls} className="fill-none stroke-ink/20" />
              <path d={site.roadCentre} className="fill-none stroke-ink/25" strokeDasharray="7 6" />
              {site.trees.map((t, i) => (
                <circle key={i} cx={t.cx} cy={t.cy} r={t.r} className="fill-ink/[0.03] stroke-ink/25" />
              ))}
              {site.play.circles.map((c, i) => (
                <circle key={i} cx={c.cx} cy={c.cy} r={c.r} className={hair} />
              ))}
              {site.play.squares.map((s, i) => (
                <rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} className={hair} />
              ))}
              <path d={site.entrance} className="fill-none stroke-ink/60" />
              <circle cx={site.north.cx} cy={site.north.cy} r={site.north.r} className="fill-none stroke-ink/35" />
              <path d={site.north.arrow} className="fill-none stroke-ink/60" />
            </g>
          </g>

          {volumes.map((vol) => {
            const active = activeId === vol.id;
            const dimmed = !!activeId && !active;
            const selected = selectedId === vol.id;
            const riseStyle = { '--cx-rise': `${vol.rise}px`, '--cx-i': vol.order } as CSSProperties;
            const body = (
              <g className="cx-rise" style={riseStyle}>
                {vol.faces.map((f) => (
                  <g key={f.side}>
                    <polygon points={pts(f.points)} className="fill-canvas-alt" />
                    {f.shade === 1 && <polygon points={pts(f.points)} className="fill-ink/[0.07]" />}
                  </g>
                ))}
                <polygon points={pts(vol.roof)} className="fill-surface" />
                <polygon points={pts(vol.roof)} className="fill-ink/[0.03]" />
                <path d={vol.windows} className="fill-ink/[0.16]" />
                <path d={vol.storeys} className="fill-none stroke-ink/[0.12]" />
                <path d={vol.plinth} className="fill-none stroke-ink/30" />
                <path d={vol.parapet} className="fill-none stroke-ink/15" />
                {/* Highlight: accent wash and contour; the other volume dims. */}
                <polygon
                  points={pts(vol.silhouette)}
                  className={cn(
                    'fill-accent/15 transition-opacity duration-300 ease-premium',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <path d={vol.edges} className="fill-none stroke-ink/45" />
                <polygon
                  points={pts(vol.silhouette)}
                  className={cn(
                    'fill-none stroke-accent transition-opacity duration-300 ease-premium',
                    active || selected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <polygon
                  points={pts(vol.silhouette)}
                  className={cn(
                    'pointer-events-none fill-canvas transition-opacity duration-500 ease-premium',
                    dimmed ? 'opacity-40' : 'opacity-0',
                  )}
                />
                {interactive && (
                  <polygon
                    points={pts(vol.silhouette)}
                    className="pointer-events-none fill-none stroke-accent-strong opacity-0 group-focus-visible:opacity-100"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
            const clipped = rise !== 'none' ? <g clipPath={`url(#${idPrefix}-clip-${vol.id})`}>{body}</g> : body;
            return zoneProps ? (
              <g
                key={vol.id}
                {...zoneProps(vol.building)}
                className="group cursor-pointer outline-none focus-visible:outline-none"
              >
                {clipped}
              </g>
            ) : (
              <g key={vol.id}>{clipped}</g>
            );
          })}
        </svg>

        {/* HTML over the drawing: text stays crisp and the same size at any width. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {overlay.map((l) => {
            const text = textOf(l.type);
            return (
              <span
                key={l.key}
                className={cn(
                  // The halo knocks the linework out behind the letters, so a
                  // name that overlaps a feature outline stays legible.
                  'cx-ground cx-halo label absolute whitespace-nowrap',
                  l.type === 'north' ? 'text-ink/70' : 'text-muted',
                  l.type !== 'north' && l.type !== 'road' && 'hidden sm:block',
                )}
                style={{
                  left: `${l.left}%`,
                  top: `${l.top}%`,
                  transform: `translate(${l.align === 'end' ? '-100%' : '-50%'}, -50%) rotate(${l.angle}deg)`,
                }}
              >
                {text}
              </span>
            );
          })}
          {volumes.map((vol) => {
            const p = geometry.pins[vol.id];
            const on = activeId === vol.id || selectedId === vol.id;
            const hit = pinProps?.(vol.building);
            return (
              <span
                key={vol.id}
                className="cx-pin absolute"
                style={{ left: `${p.left}%`, top: `${p.top}%`, '--cx-i': vol.order } as CSSProperties}
              >
                <span
                  {...hit}
                  className={cn(
                    'absolute bottom-0 left-0 flex -translate-x-1/2 flex-col items-center',
                    hit && 'pointer-events-auto cursor-pointer [-webkit-tap-highlight-color:transparent]',
                  )}
                >
                  {/* Pin + stem are ~50px tall; the margin brings the target past 44px each way. */}
                  {hit && <span className="absolute -inset-x-2 -inset-y-1.5" />}
                  <span
                    className={cn(
                      'label flex items-center gap-2 whitespace-nowrap border bg-canvas px-2.5 py-1.5 transition-colors duration-300 ease-premium',
                      on ? 'border-accent text-ink' : 'border-line/20 text-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 transition-colors duration-300 ease-premium',
                        on ? 'bg-accent' : 'bg-ink/30',
                      )}
                    />
                    {labels.names[vol.id]}
                  </span>
                  <span className={cn('h-5 w-px sm:h-7', on ? 'bg-accent' : 'bg-ink/30')} />
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** One site feature as thin linework, in plan metres. */
function Feature({ feature: f }: { feature: SiteFeature }) {
  const { x, y, w, h } = f.rect;
  switch (f.type) {
    case 'courtyard':
      return <rect x={x} y={y} width={w} height={h} className="fill-ink/[0.025] stroke-ink/15" />;
    case 'green':
      return <rect x={x} y={y} width={w} height={h} className="fill-ink/[0.02] stroke-ink/15" strokeDasharray="2 3" />;
    case 'playground':
      return <rect x={x} y={y} width={w} height={h} className="fill-none stroke-ink/30" strokeDasharray="4 3" />;
    case 'parking':
      return <rect x={x} y={y} width={w} height={h} className="fill-ink/[0.02] stroke-ink/25" />;
    case 'road':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} className="fill-ink/[0.05] stroke-none" />
          {w >= h ? (
            <>
              <line x1={x} y1={y} x2={x + w} y2={y} className="stroke-ink/30" />
              <line x1={x} y1={y + h} x2={x + w} y2={y + h} className="stroke-ink/30" />
            </>
          ) : (
            <>
              <line x1={x} y1={y} x2={x} y2={y + h} className="stroke-ink/30" />
              <line x1={x + w} y1={y} x2={x + w} y2={y + h} className="stroke-ink/30" />
            </>
          )}
        </g>
      );
    // The entrance is drawn as gate posts and an arrow (SiteDrawing.entrance).
    default:
      return null;
  }
}

/**
 * Key to the linework, for phones (where the names on the drawing are
 * hidden) and as the text alternative of the ground plane.
 */
export function ComplexLegend({
  title,
  labels,
  types,
  className,
}: {
  title: string;
  labels: Record<FeatureType, string>;
  types: FeatureType[];
  className?: string;
}) {
  const unique = [...new Set(types)];
  return (
    <div className={className}>
      <p className="sr-only">{title}</p>
      <ul className="label flex flex-wrap gap-x-6 gap-y-3 text-muted">
        {unique.map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <Swatch type={t} />
            {labels[t]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Swatch({ type }: { type: FeatureType }) {
  return (
    <svg viewBox="0 0 16 10" aria-hidden="true" className="h-2.5 w-4 shrink-0 overflow-visible">
      {type === 'green' && (
        <>
          <circle cx={5} cy={5} r={3.5} className="fill-ink/[0.03] stroke-ink/40" />
          <circle cx={11.5} cy={5} r={2.8} className="fill-ink/[0.03] stroke-ink/40" />
        </>
      )}
      {type === 'playground' && <rect x={0.5} y={0.5} width={15} height={9} className="fill-none stroke-ink/50" strokeDasharray="3 2" />}
      {type === 'parking' && <path d="M.5 .5h15v9H.5zM4 .5v4M8 .5v4M12 .5v4" className="fill-none stroke-ink/40" />}
      {type === 'courtyard' && <rect x={0.5} y={0.5} width={15} height={9} className="fill-ink/[0.06] stroke-ink/30" />}
      {type === 'road' && <path d="M0 1h16M0 9h16M1 5h4M7 5h4M13 5h3" className="fill-none stroke-ink/40" />}
      {type === 'entrance' && <path d="M8 10V1M5 4l3-3 3 3" className="fill-none stroke-ink/60" />}
    </svg>
  );
}
