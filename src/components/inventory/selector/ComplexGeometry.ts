/**
 * Axonometric geometry of the site scheme (step 1 of the selector).
 *
 * Pure functions, no React: the interactive scheme, the static preview on the
 * project page and — later — a camera preset for the 3D scene all read the
 * same numbers. Input is the inventory's own plan data in metres (site size,
 * site features, building footprints, storeys × storey height); output is
 * screen geometry in viewBox units.
 *
 * Projection: the plan is turned about the vertical axis (`rotation`) and seen
 * from a raised camera (`elevation`), orthographic — parallel lines stay
 * parallel, as in an architect's axonometric drawing:
 *
 *   u = x·cos r − y·sin r
 *   v = (x·sin r + y·cos r)·sin e − z·cos e
 *
 * Plan x runs east, plan y runs south (the site's north is "up" on the plan).
 */
import type { Building, ProjectInventory, SiteFeature, Vec2 } from '@/lib/inventory/types';

export interface AxoView {
  cos: number;
  sin: number;
  /** Foreshortening of plan depth: sin(elevation). */
  depth: number;
  /** Scale of heights: cos(elevation). */
  lift: number;
}

export function axoView(rotationDeg: number, elevationDeg: number): AxoView {
  const r = (rotationDeg * Math.PI) / 180;
  const e = (elevationDeg * Math.PI) / 180;
  return { cos: Math.cos(r), sin: Math.sin(r), depth: Math.sin(e), lift: Math.cos(e) };
}

/** Seen from the south-west, 20° off the street, camera raised 35° (near-isometric). */
export const DEFAULT_VIEW = axoView(-20, 35);

export function project(v: AxoView, x: number, y: number, z = 0): Vec2 {
  return [x * v.cos - y * v.sin, (x * v.sin + y * v.cos) * v.depth - z * v.lift];
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** SVG transform that draws plan coordinates (metres) straight onto the ground plane. */
export function groundMatrix(v: AxoView): string {
  return `matrix(${r3(v.cos)} ${r3(v.sin * v.depth)} ${r3(-v.sin)} ${r3(v.cos * v.depth)} 0 0)`;
}

export const pts = (list: Vec2[]) => list.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' ');
const at = (p: Vec2) => `${r2(p[0])} ${r2(p[1])}`;
const quad = (a: Vec2, b: Vec2, c: Vec2, d: Vec2) => `M${at(a)}L${at(b)}L${at(c)}L${at(d)}Z`;
const seg = (a: Vec2, b: Vec2) => `M${at(a)}L${at(b)}`;

/** Andrew's monotone chain; returns the hull counter-clockwise on screen. */
function hull(points: Vec2[]): Vec2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Vec2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Vec2[] = [];
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/* ------------------------------------------------------------------------ */
/* Buildings                                                                  */
/* ------------------------------------------------------------------------ */

type Side = 'north' | 'east' | 'south' | 'west';

export interface BuildingVolume {
  id: string;
  building: Building;
  /** Order of appearance (buildings rise one after another). */
  order: number;
  /** Screen distance the volume travels when it rises out of its footprint. */
  rise: number;
  silhouette: Vec2[];
  roof: Vec2[];
  /** Visible façades; `shade` 1 is the one turned further from the viewer. */
  faces: { side: Side; points: Vec2[]; shade: 0 | 1 }[];
  /** Region above the front base line: clips the volume while it rises. */
  clip: Vec2[];
  edges: string;
  plinth: string;
  storeys: string;
  windows: string;
  parapet: string;
  roofCenter: Vec2;
}

function volume(v: AxoView, b: Building, order: number): BuildingVolume {
  const { x, y, w, h } = b.footprint;
  const sh = b.storeyHeight;
  const H = b.floorsCount * sh;
  const NW: Vec2 = [x, y];
  const NE: Vec2 = [x + w, y];
  const SE: Vec2 = [x + w, y + h];
  const SW: Vec2 = [x, y + h];
  const P = (c: Vec2, z = 0) => project(v, c[0], c[1], z);

  const sides: { side: Side; a: Vec2; b: Vec2; n: Vec2 }[] = [
    { side: 'north', a: NW, b: NE, n: [0, -1] },
    { side: 'east', a: NE, b: SE, n: [1, 0] },
    { side: 'south', a: SE, b: SW, n: [0, 1] },
    { side: 'west', a: SW, b: NW, n: [-1, 0] },
  ];
  // A façade faces the camera when its normal, turned with the plan, points
  // down the screen (towards the viewer).
  const visible = sides
    .map((s) => ({ ...s, facing: s.n[0] * v.sin + s.n[1] * v.cos }))
    .filter((s) => s.facing > 1e-6)
    .sort((p, q) => q.facing - p.facing);

  const faces = visible.map((s, i) => ({
    side: s.side,
    points: [P(s.a), P(s.b), P(s.b, H), P(s.a, H)],
    shade: (i === 0 ? 0 : 1) as 0 | 1,
  }));

  // Storey lines, the plinth line and a quiet window rhythm on each visible
  // façade. The ground floor (below the first residential floor) reads as
  // shop-front glazing: wider, taller panes.
  const lerp = (a: Vec2, c: Vec2, t: number): Vec2 => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
  const nonResidential = Math.max(0, b.firstResidentialFloor - 1);
  let storeys = '';
  let plinth = '';
  let windows = '';
  for (const s of visible) {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    const bays = Math.max(2, Math.round(len / 3.4));
    for (let k = 1; k < b.floorsCount; k += 1) {
      const line = seg(P(s.a, k * sh), P(s.b, k * sh));
      if (k === nonResidential) plinth += line;
      else storeys += line;
    }
    for (let k = 0; k < b.floorsCount; k += 1) {
      const z0 = k * sh;
      const shop = k < nonResidential;
      const lo = shop ? z0 + 0.45 : z0 + sh * 0.24;
      const hi = shop ? z0 + sh * 0.84 : z0 + sh * 0.8;
      for (let i = 0; i < bays; i += 1) {
        let t0: number;
        let t1: number;
        if (shop) {
          t0 = (i + 0.1) / bays;
          t1 = (i + 0.9) / bays;
        } else {
          // Upright panes, narrower than a storey is tall.
          const half = Math.min(0.48, (len / bays) * 0.15) / len;
          t0 = (i + 0.5) / bays - half;
          t1 = (i + 0.5) / bays + half;
        }
        const a0 = lerp(s.a, s.b, t0);
        const a1 = lerp(s.a, s.b, t1);
        windows += quad(P(a0, lo), P(a1, lo), P(a1, hi), P(a0, hi));
      }
    }
  }

  // Outline: roof, the visible vertical corners, the visible base.
  const corners = new Set<Vec2>();
  for (const s of visible) {
    corners.add(s.a);
    corners.add(s.b);
  }
  let edges = `M${at(P(NW, H))}L${at(P(NE, H))}L${at(P(SE, H))}L${at(P(SW, H))}Z`;
  for (const c of corners) edges += seg(P(c), P(c, H));
  for (const s of visible) edges += seg(P(s.a), P(s.b));

  const inset = Math.min(0.6, w / 8, h / 8);
  const parapet =
    `M${at(project(v, x + inset, y + inset, H))}L${at(project(v, x + w - inset, y + inset, H))}` +
    `L${at(project(v, x + w - inset, y + h - inset, H))}L${at(project(v, x + inset, y + h - inset, H))}Z`;

  const all = [NW, NE, SE, SW].flatMap((c) => [P(c), P(c, H)]);
  const silhouette = hull(all);

  // Clip: everything above the front base line, a hair below it so the
  // contour stroke is not cut, and open to the sides and the sky.
  const base = [...corners].map((c) => P(c)).sort((p, q) => p[0] - q[0]);
  const top = Math.min(...silhouette.map((p) => p[1])) - 40;
  const drop = 0.4;
  const left = base[0];
  const right = base[base.length - 1];
  const clip: Vec2[] = [
    [left[0] - 3, top],
    [right[0] + 3, top],
    [right[0] + 3, right[1] + drop],
    ...base
      .slice()
      .reverse()
      .map((p): Vec2 => [p[0], p[1] + drop]),
    [left[0] - 3, left[1] + drop],
  ];

  return {
    id: b.id,
    building: b,
    order,
    rise: r2(H * v.lift),
    silhouette,
    roof: [P(NW, H), P(NE, H), P(SE, H), P(SW, H)],
    faces,
    clip,
    edges,
    plinth,
    storeys,
    windows,
    parapet,
    roofCenter: project(v, x + w / 2, y + h / 2, H),
  };
}

/* ------------------------------------------------------------------------ */
/* Site                                                                       */
/* ------------------------------------------------------------------------ */

export interface Tree {
  cx: number;
  cy: number;
  r: number;
}

export interface SiteDrawing {
  size: Vec2;
  features: SiteFeature[];
  trees: Tree[];
  /** Parking stall lines, playground furniture, road centre line — plan coordinates. */
  stalls: string;
  play: { circles: Tree[]; squares: { x: number; y: number; s: number }[] };
  roadCentre: string;
  entrance: string;
  north: { cx: number; cy: number; r: number; arrow: string; tip: Vec2 };
}

/** Deterministic pseudo-random in [0, 1): the drawing is identical on server and client. */
function seeded(n: number) {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
}

function siteDrawing(inv: ProjectInventory): SiteDrawing {
  const [W] = inv.site.size;
  const trees: Tree[] = [];
  let stalls = '';
  const circles: Tree[] = [];
  const squares: { x: number; y: number; s: number }[] = [];
  let roadCentre = '';
  let entrance = '';
  const P2 = (x: number, y: number): Vec2 => [x, y];

  inv.site.features.forEach((f, fi) => {
    const { x, y, w, h } = f.rect;
    if (f.type === 'green') {
      const step = 3.6;
      const nx = Math.max(1, Math.floor((w - 1.6) / step));
      const ny = Math.max(1, Math.floor((h - 1.6) / step));
      for (let i = 0; i < nx; i += 1) {
        for (let j = 0; j < ny; j += 1) {
          const k = fi * 97 + i * 13 + j * 7;
          if (seeded(k) < 0.18) continue;
          trees.push({
            cx: r2(x + (w / nx) * (i + 0.5) + (seeded(k + 1) - 0.5) * 1.1),
            cy: r2(y + (h / ny) * (j + 0.5) + (seeded(k + 2) - 0.5) * 1.1),
            r: r2(1.0 + seeded(k + 3) * 0.6),
          });
        }
      }
    } else if (f.type === 'parking') {
      // Stalls along both long sides, 2.6 m wide, 5 m deep.
      const along = w >= h;
      const len = along ? w : h;
      const depth = Math.min(5, (along ? h : w) * 0.4);
      for (let t = 2.6; t < len - 0.5; t += 2.6) {
        if (along) {
          stalls += seg(P2(x + t, y), P2(x + t, y + depth)) + seg(P2(x + t, y + h - depth), P2(x + t, y + h));
        } else {
          stalls += seg(P2(x, y + t), P2(x + depth, y + t)) + seg(P2(x + w - depth, y + t), P2(x + w, y + t));
        }
      }
      stalls += along
        ? seg(P2(x, y + depth), P2(x + w, y + depth)) + seg(P2(x, y + h - depth), P2(x + w, y + h - depth))
        : seg(P2(x + depth, y), P2(x + depth, y + h)) + seg(P2(x + w - depth, y), P2(x + w - depth, y + h));
    } else if (f.type === 'playground') {
      circles.push({ cx: r2(x + w * 0.28), cy: r2(y + h * 0.5), r: r2(Math.min(w, h) * 0.18) });
      circles.push({ cx: r2(x + w * 0.52), cy: r2(y + h * 0.32), r: r2(Math.min(w, h) * 0.08) });
      squares.push({ x: r2(x + w * 0.64), y: r2(y + h * 0.42), s: r2(Math.min(w, h) * 0.34) });
    } else if (f.type === 'road') {
      roadCentre += w >= h ? seg(P2(x, y + h / 2), P2(x + w, y + h / 2)) : seg(P2(x + w / 2, y), P2(x + w / 2, y + h));
    } else if (f.type === 'entrance') {
      // Gate posts on the street edge and an arrow into the site.
      const cx = x + w / 2;
      entrance +=
        seg(P2(x, y + h), P2(x, y + h - 1.2)) +
        seg(P2(x + w, y + h), P2(x + w, y + h - 1.2)) +
        seg(P2(cx, y + h + 1.2), P2(cx, y - 0.6)) +
        seg(P2(cx - 0.9, y + 0.6), P2(cx, y - 0.6)) +
        seg(P2(cx + 0.9, y + 0.6), P2(cx, y - 0.6));
    }
  });

  // North arrow in the site's north-west corner, turned by `site.north`.
  const n = (inv.site.north * Math.PI) / 180;
  const dir: Vec2 = [Math.sin(n), -Math.cos(n)];
  const cx = Math.min(4, W * 0.05);
  const cy = 4.5;
  const R = 2.2;
  const tipIn: Vec2 = [cx + dir[0] * R, cy + dir[1] * R];
  const tail: Vec2 = [cx - dir[0] * R, cy - dir[1] * R];
  const perp: Vec2 = [-dir[1], dir[0]];
  const arrow =
    seg(tail, tipIn) +
    seg([tipIn[0] - dir[0] * 1.1 + perp[0] * 0.7, tipIn[1] - dir[1] * 1.1 + perp[1] * 0.7], tipIn) +
    seg([tipIn[0] - dir[0] * 1.1 - perp[0] * 0.7, tipIn[1] - dir[1] * 1.1 - perp[1] * 0.7], tipIn);

  return {
    size: inv.site.size,
    features: inv.site.features,
    trees,
    stalls,
    play: { circles, squares },
    roadCentre,
    entrance,
    north: { cx, cy, r: R, arrow, tip: [cx + dir[0] * (R + 1.8), cy + dir[1] * (R + 1.8)] },
  };
}

/* ------------------------------------------------------------------------ */
/* Whole scheme                                                               */
/* ------------------------------------------------------------------------ */

export type LabelType = SiteFeature['type'] | 'north';

/** Where a name may go: screen points in order of preference. */
export interface LabelSpot {
  key: string;
  type: LabelType;
  candidates: Vec2[];
  /** Degrees; the street name follows the road. */
  angle: number;
  align: 'center' | 'end';
}

export interface OverlayLabel {
  key: string;
  type: LabelType;
  /** Position in % of the drawing box. */
  left: number;
  top: number;
  angle: number;
  align: 'center' | 'end';
}

export interface ComplexGeometry {
  view: AxoView;
  viewBox: { x: number; y: number; w: number; h: number };
  /** Narrow screens: the horizontal band holding the buildings (viewBox units). */
  crop: { x: number; w: number };
  ground: string;
  site: SiteDrawing;
  /** Far to near: painter's order. */
  volumes: BuildingVolume[];
  /** % of the drawing box, for HTML pins that stay crisp at any size. */
  pins: Record<string, { left: number; top: number }>;
  spots: LabelSpot[];
}

function inside(p: Vec2, poly: Vec2[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * Put each site name at its first candidate spot that no building covers.
 * `halfWidth` is the label's half width in viewBox units (estimated by the
 * caller from the text); a name with no free spot is left out — the legend
 * still lists it.
 */
export function placeLabels(g: ComplexGeometry, halfWidth: (type: LabelType) => number): OverlayLabel[] {
  const { viewBox: vb } = g;
  const out: OverlayLabel[] = [];
  for (const s of g.spots) {
    const hw = halfWidth(s.type);
    const hh = 1.3;
    const free = s.candidates.find((c) => {
      const x0 = s.align === 'end' ? c[0] - hw * 2 : c[0] - hw;
      const x1 = s.align === 'end' ? c[0] : c[0] + hw;
      const probes: Vec2[] = [];
      for (let t = 0; t <= 4; t += 1) {
        const x = x0 + ((x1 - x0) * t) / 4;
        probes.push([x, c[1] - hh], [x, c[1] + hh]);
      }
      return !g.volumes.some((vol) => probes.some((p) => inside(p, vol.silhouette)));
    });
    if (!free) continue;
    out.push({
      key: s.key,
      type: s.type,
      left: r2(((free[0] - vb.x) / vb.w) * 100),
      top: r2(((free[1] - vb.y) / vb.h) * 100),
      angle: s.angle,
      align: s.align,
    });
  }
  return out;
}

export function complexGeometry(inv: ProjectInventory, v: AxoView = DEFAULT_VIEW): ComplexGeometry {
  const [W, D] = inv.site.size;

  // Buildings appear west to east; they are painted far to near.
  const byX = [...inv.buildings].sort((a, b) => a.footprint.x - b.footprint.x);
  const volumes = byX
    .map((b, i) => volume(v, b, i))
    .sort((p, q) => {
      const c = (b: Building) => {
        const f = b.footprint;
        return (f.x + f.w / 2) * v.sin + (f.y + f.h / 2) * v.cos;
      };
      return c(p.building) - c(q.building);
    });

  const outline = [project(v, 0, 0), project(v, W, 0), project(v, W, D), project(v, 0, D)];
  const extent = [...outline, ...volumes.flatMap((vol) => vol.silhouette)];
  const minX = Math.min(...extent.map((p) => p[0]));
  const maxX = Math.max(...extent.map((p) => p[0]));
  const minY = Math.min(...extent.map((p) => p[1]));
  const maxY = Math.max(...extent.map((p) => p[1]));
  const pad = (maxX - minX) * 0.02;
  const viewBox = { x: r2(minX - pad), y: r2(minY - pad), w: r2(maxX - minX + pad * 2), h: r2(maxY - minY + pad * 2) };

  const bx = volumes.flatMap((vol) => vol.silhouette.map((p) => p[0]));
  const cropX = Math.max(viewBox.x, Math.min(...bx) - pad * 2);
  const cropR = Math.min(viewBox.x + viewBox.w, Math.max(...bx) + pad * 2);
  const crop = { x: r2(cropX), w: r2(cropR - cropX) };

  const pct = (p: Vec2) => ({
    left: r2(((p[0] - viewBox.x) / viewBox.w) * 100),
    top: r2(((p[1] - viewBox.y) / viewBox.h) * 100),
  });

  const pins: ComplexGeometry['pins'] = {};
  for (const vol of volumes) pins[vol.id] = pct(vol.roofCenter);

  const site = siteDrawing(inv);
  const spots: LabelSpot[] = [];
  // Inside a feature: its centre first, then points around it.
  const GRID: Vec2[] = [
    [0.5, 0.5], [0.35, 0.5], [0.65, 0.5], [0.5, 0.3], [0.5, 0.7],
    [0.25, 0.3], [0.75, 0.3], [0.25, 0.7], [0.75, 0.7],
  ];
  inv.site.features.forEach((f, i) => {
    const { x, y, w, h } = f.rect;
    if (f.type === 'green') return;
    if (f.type === 'road') {
      const along = w >= h;
      const a = project(v, 0, 0);
      const b = along ? project(v, 1, 0) : project(v, 0, 1);
      let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      // The street name sits in the western third, clear of the entrance.
      const at = (t: number) => (along ? project(v, x + w * t, y + h / 2) : project(v, x + w / 2, y + h * t));
      spots.push({ key: `f${i}`, type: 'road', candidates: [at(0.3), at(0.2), at(0.7)], angle: r2(angle), align: 'center' });
      return;
    }
    if (f.type === 'entrance') {
      spots.push({ key: `f${i}`, type: 'entrance', candidates: [project(v, x - 1.2, y + h / 2)], angle: 0, align: 'end' });
      return;
    }
    spots.push({
      key: `f${i}`,
      type: f.type,
      candidates: GRID.map(([tx, ty]) => project(v, x + w * tx, y + h * ty)),
      angle: 0,
      align: 'center',
    });
  });
  spots.push({ key: 'north', type: 'north', candidates: [project(v, site.north.tip[0], site.north.tip[1])], angle: 0, align: 'center' });

  return { view: v, viewBox, crop, ground: groundMatrix(v), site, volumes, pins, spots };
}
