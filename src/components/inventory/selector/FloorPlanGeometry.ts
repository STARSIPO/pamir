/**
 * Floor-plan geometry for step 3, in plate metres (x along the corridor,
 * y from the north façade to the south façade).
 *
 * Every apartment's own plan (`plan2D`, drawn with its balcony up and its
 * entrance down) is placed into its slot on the plate: as-is on the north
 * side, mirrored top-to-bottom on the south side, so every balcony faces
 * outward and every entrance opens onto the corridor.
 *
 * `planFrame()` then maps plate metres into the drawing: landscape (north up)
 * from md, portrait (turned 90° clockwise, north to the right) below it,
 * where the plate's long side runs down the screen and every apartment stays
 * a comfortable tap target with legible captions.
 */
import type { Apartment, FloorPlate, FloorSlot, Polygon, RoomType, Vec2 } from '@/lib/inventory/types';

export type PlanOrientation = 'landscape' | 'portrait';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlanFrame {
  orientation: PlanOrientation;
  view: Rect;
  /** Plate point → drawing point. */
  pt: (p: Vec2) => Vec2;
  /** Plate rectangle → drawing rectangle (axis-aligned either way). */
  rect: (r: Rect) => Rect;
  /** Degrees the drawing is turned clockwise relative to the plate (north up). */
  rotation: number;
}

/** Margins around the plate: [along plate x, along plate y]. */
const MARGIN: Record<PlanOrientation, [number, number]> = {
  landscape: [1.6, 4.6],
  portrait: [2.9, 3.7],
};

export function planFrame(plate: FloorPlate, orientation: PlanOrientation): PlanFrame {
  const [W, H] = plate.size;
  const [mx, my] = MARGIN[orientation];
  if (orientation === 'landscape') {
    return {
      orientation,
      view: { x: -mx, y: -my, w: W + 2 * mx, h: H + 2 * my },
      pt: (p) => p,
      rect: (r) => r,
      rotation: 0,
    };
  }
  const pt = ([x, y]: Vec2): Vec2 => [H - y, x];
  return {
    orientation,
    view: { x: -my, y: -mx, w: H + 2 * my, h: W + 2 * mx },
    pt,
    rect: (r) => {
      const a = pt([r.x, r.y]);
      const b = pt([r.x + r.w, r.y + r.h]);
      return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) };
    },
    rotation: 90,
  };
}

const OUTDOOR: ReadonlySet<RoomType> = new Set<RoomType>(['balcony', 'terrace']);

export const isOutdoor = (t: RoomType) => OUTDOOR.has(t);

function bounds(p: Polygon) {
  const xs = p.map((v) => v[0]);
  const ys = p.map((v) => v[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

function dedupe(pts: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || !near(p[0], q[0]) || !near(p[1], q[1])) out.push(p);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (out.length > 1 && near(first[0], last[0]) && near(first[1], last[1])) out.pop();
  return out;
}

export interface ZoneRoom {
  id: string;
  type: RoomType;
  poly: Polygon;
}

export interface Zone {
  apartment: Apartment;
  slot: FloorSlot;
  /** Heated area + outdoor space, one closed outline. */
  outline: Polygon;
  rooms: ZoneRoom[];
  /** Door swing at the entrance, as a polyline (leaf + quarter arc). */
  door: Vec2[];
  /** Window openings on the façade wall (rectangles centred on the wall). */
  windows: { a: Vec2; b: Vec2 }[];
  /** Centre of the main room: where the number and area are set. */
  label: Vec2;
}

/** Map a point of the apartment's own frame onto the plate. */
function placer(slot: FloorSlot, a: Apartment) {
  const top = bounds(a.plan2D.outline).y0;
  const { x, y, h } = slot.rect;
  return slot.facade === 'north'
    ? ([px, py]: Vec2): Vec2 => [x + px, y + (py - top)]
    : ([px, py]: Vec2): Vec2 => [x + px, y + h - (py - top)];
}

export function buildZones(plate: FloorPlate, apartments: Apartment[]): Zone[] {
  const zones: Zone[] = [];
  for (const slot of plate.slots) {
    const a = apartments.find((ap) => ap.slot === slot.id);
    if (!a) continue;
    const place = placer(slot, a);
    const ob = bounds(a.plan2D.outline);
    const top = ob.y0;
    const bottom = ob.y1;
    const w = a.plan2D.size[0];

    // Outline: the heated rectangle with each outdoor space notched out of
    // the façade edge (apartment frame, then placed).
    const outdoor = a.plan2D.rooms
      .filter((r) => isOutdoor(r.type))
      .map((r) => bounds(r.polygon))
      .sort((p, q) => p.x0 - q.x0);
    const pts: Vec2[] = [[0, top]];
    for (const o of outdoor) pts.push([o.x0, top], [o.x0, o.y0], [o.x1, o.y0], [o.x1, top]);
    pts.push([w, top], [w, bottom], [0, bottom]);
    const outline = dedupe(pts).map(place);

    const rooms = a.plan2D.rooms.map((r) => ({ id: r.id, type: r.type, poly: r.polygon.map(place) }));

    // Door: hinge 0.45 m left of the entrance mark, the leaf swung into the hall.
    const [ex, ey] = a.plan2D.entrance;
    const r = 0.9;
    const hx = ex - r / 2;
    const door: Vec2[] = [[hx, ey]];
    for (let i = 0; i <= 10; i += 1) {
      const t = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
      door.push([hx + r * Math.cos(t), ey + r * Math.sin(t)]);
    }

    // Windows where a habitable room meets the façade.
    const windows: { a: Vec2; b: Vec2 }[] = [];
    for (const room of a.plan2D.rooms) {
      if (isOutdoor(room.type)) continue;
      const bb = bounds(room.polygon);
      if (!near(bb.y0, top)) continue;
      const cx = (bb.x0 + bb.x1) / 2;
      const onBalcony = outdoor.some((o) => cx > o.x0 && cx < o.x1);
      const ww = Math.min(Math.max((bb.x1 - bb.x0) * (onBalcony ? 0.5 : 0.42), 0.9), onBalcony ? 2.6 : 1.9);
      windows.push({ a: place([cx - ww / 2, top]), b: place([cx + ww / 2, top]) });
    }

    const main =
      a.plan2D.rooms.find((rm) => rm.type === 'kitchen-living') ??
      a.plan2D.rooms.find((rm) => rm.type === 'living') ??
      a.plan2D.rooms.find((rm) => !isOutdoor(rm.type))!;
    const mb = bounds(main.polygon);

    zones.push({
      apartment: a,
      slot,
      outline,
      rooms,
      door: door.map(place),
      windows,
      label: place([(mb.x0 + mb.x1) / 2, (mb.y0 + mb.y1) / 2]),
    });
  }
  return zones;
}

/**
 * The polygon moved inward by `d` metres — the status line of a zone runs
 * just inside its walls instead of on them. Exact for the plan's rectilinear
 * outlines (right angles, convex or concave, collinear points allowed): each
 * vertex moves to where its two edges' offset lines meet.
 */
export function insetPolygon(poly: Polygon, d: number): Polygon {
  const n = poly.length;
  if (n < 3) return poly;
  let area = 0;
  for (let i = 0; i < n; i += 1) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  const s = area > 0 ? 1 : -1;
  const inward = (a: Vec2, b: Vec2): Vec2 => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [(-dy / len) * s, (dx / len) * s];
  };
  return poly.map((p, i) => {
    const n1 = inward(poly[(i - 1 + n) % n], p);
    const n2 = inward(p, poly[(i + 1) % n]);
    const f = d / (1 + n1[0] * n2[0] + n1[1] * n2[1] || 1);
    return [p[0] + (n1[0] + n2[0]) * f, p[1] + (n1[1] + n2[1]) * f];
  });
}

/** Which way each long façade looks, from the slots' view features. */
export function facadeViews(plate: FloorPlate): { north: 'courtyard' | 'street' | null; south: 'courtyard' | 'street' | null } {
  const side = (f: 'north' | 'south') => {
    const feats = plate.slots.filter((s) => s.facade === f).flatMap((s) => s.features);
    if (feats.includes('courtyard-view')) return 'courtyard' as const;
    if (feats.includes('street-view')) return 'street' as const;
    return null;
  };
  return { north: side('north'), south: side('south') };
}

/** Stair treads and lift shaft inside the core (plate metres). */
export function coreParts(core: Rect) {
  const pad = 0.25;
  const stair: Rect = { x: core.x + pad, y: core.y + pad, w: core.w * 0.52 - pad * 1.5, h: core.h - pad * 2 - 1.4 };
  const lift: Rect = {
    x: core.x + core.w * 0.52 + pad * 0.5,
    y: core.y + pad,
    w: core.w * 0.48 - pad * 1.5,
    h: Math.min(2.3, core.h * 0.34),
  };
  const lobby: Rect = {
    x: core.x + pad,
    y: stair.y + stair.h + pad,
    w: core.w - pad * 2,
    h: core.y + core.h - (stair.y + stair.h + pad),
  };
  const liftLobby: Rect = { x: lift.x, y: lift.y + lift.h + pad, w: lift.w, h: lobby.y - (lift.y + lift.h + pad) };
  // Two flights side by side, treads every 0.3 m, a landing at the far end.
  const treads: [Vec2, Vec2][] = [];
  const landing = 1.2;
  for (let y = stair.y + landing; y < stair.y + stair.h - 0.05; y += 0.3) {
    treads.push([
      [stair.x, y],
      [stair.x + stair.w, y],
    ]);
  }
  const divider: [Vec2, Vec2] = [
    [stair.x + stair.w / 2, stair.y + landing],
    [stair.x + stair.w / 2, stair.y + stair.h],
  ];
  return { stair, lift, lobby, liftLobby, treads, divider };
}

export const toPath = (pts: Vec2[], close = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${round(p[0])} ${round(p[1])}`).join('') + (close ? 'Z' : '');

const round = (n: number) => Math.round(n * 1000) / 1000;
