/**
 * Draw-in motion for the elevation and the floor plan, as plain CSS keyframes.
 *
 * Fail-safe like the rest of the site: every element's resting state is its
 * final, visible state; the keyframes only describe the way in (`both` fill),
 * so without CSS animation support the drawing simply shows. Durations stay
 * within the site's 200–900 ms. With `prefers-reduced-motion` the animations
 * are switched off outright — the global rule only shortens durations and
 * would keep the stagger delays, so the zones would still pop in one by one.
 *
 * React 19 hoists a <style> with `href` + `precedence` into <head> once, however
 * many drawings render it.
 *
 *   invf-draw   stroke draws along the path (needs pathLength="1")
 *   invf-fade   fades in; stagger with the --invf-d custom property
 *   invf-rise   the building rises from its base (clip from the bottom)
 */
const CSS = `
.invf-draw{stroke-dasharray:1;stroke-dashoffset:0;animation:invf-draw .9s cubic-bezier(0.65,0,0.35,1) both;animation-delay:var(--invf-d,0ms)}
@keyframes invf-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.invf-fade{animation:invf-fade .8s cubic-bezier(0.22,1,0.36,1) both;animation-delay:var(--invf-d,0ms)}
@keyframes invf-fade{from{opacity:0}to{opacity:1}}
.invf-rise{animation:invf-rise .9s cubic-bezier(0.65,0,0.35,1) both;animation-delay:var(--invf-d,0ms)}
@keyframes invf-rise{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
@media (prefers-reduced-motion:reduce){.invf-draw,.invf-fade,.invf-rise{animation:none!important}}
`;

export function FloorMotionStyles() {
  return (
    <style href="inventory-floors-motion" precedence="default">
      {CSS}
    </style>
  );
}

/** Inline style for a staggered element: `style={delay(120)}`. */
export function delay(ms: number): React.CSSProperties {
  return { ['--invf-d' as string]: `${Math.round(ms)}ms` };
}
