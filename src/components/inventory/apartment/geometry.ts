/**
 * Plan geometry for the apartment drawing — pure functions, metres in, SVG
 * path strings and boxes out. Shared by the on-screen plan (ApartmentPlan2D)
 * and the downloadable standalone SVG (plan-svg.ts), so both draw the same
 * walls, windows and doors from the same numbers.
 *
 * Plan frame (see src/lib/inventory/plan-generator.ts): x left → right along
 * the corridor, y from the outdoor space's outer edge (top) down to the
 * corridor (entrance, bottom). The façade is the outline's top edge.
 */
import type { ApartmentPlan2D, Polygon, Room, RoomType, Vec2 } from '@/lib/inventory/types';

/** Exterior wall thickness, m (drawn to scale). */
export const WALL = 0.24;
/** Interior partition thickness, m. */
export const PARTITION = 0.09;
/** Entrance door leaf, m. */
export const DOOR = 0.9;
/** Interior (and balcony) door leaf, m. */
export const DOOR_INNER = 0.8;

/** Solid partition kept between an interior door and the corner, m. */
const JAMB = PARTITION / 2 + 0.1;
/**
 * Half-depth of an interior door's cut. Wider than the partition, so the
 * active room's inner accent frame, drawn along the partition, breaks at the
 * door as well.
 */
const CUT = 0.13;

const EPS = 0.02;

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Which plan side has windows besides the façade (corner apartments). */
export type CornerSide = 'left' | 'right' | 'both' | null;

export function bbox(p: Polygon): Box {
  const xs = p.map((v) => v[0]);
  const ys = p.map((v) => v[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Closed SVG path of a polygon. */
export function pathOf(p: Polygon): string {
  return p.map(([x, y], i) => `${i ? 'L' : 'M'}${r3(x)} ${r3(y)}`).join('') + 'Z';
}

/** Area centroid of a simple polygon (label anchor); bbox centre if degenerate. */
export function centroid(p: Polygon): Vec2 {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const b = bbox(p);
    return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export const isOutdoor = (t: RoomType) => t === 'balcony' || t === 'terrace';
export const isWet = (t: RoomType) => t === 'bathroom' || t === 'wc';

/** viewBox of the drawing: the plan plus room for the walls and the entrance mark. */
export interface PlanView {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = { top: 0.35, side: 0.4, bottom: 0.95 };

export function planView(plan: ApartmentPlan2D): PlanView {
  return {
    x: -PAD.side,
    y: -PAD.top,
    w: plan.size[0] + PAD.side * 2,
    h: plan.size[1] + PAD.top + PAD.bottom,
  };
}

/** A window cut into the exterior wall: along x (h) or y (v), from a to b, on the wall line `at`. */
export interface Opening {
  axis: 'h' | 'v';
  a: number;
  b: number;
  at: number;
}

/** An open door drawn in plan: the leaf standing at 90° and its quarter-circle swing. */
export interface Swing {
  /** Door leaf (open, perpendicular to the wall). */
  leaf: string;
  /** Swing arc, from the leaf back to the far jamb. */
  arc: string;
  /** The square the leaf sweeps, inside the room it opens into (labels keep clear of it). */
  swing: Box;
  /** Hinge and leaf length: the swing is the quarter disk of this radius round the hinge. */
  hinge: Vec2;
  radius: number;
}

export interface DoorMark extends Swing {
  /** The gap in the wall, as a rectangle to paint over the wall. */
  cut: Box;
  /** Point just outside the door, for the "Вход" label. */
  label: Vec2;
}

/** A door inside the apartment, or the glazed door onto the balcony / terrace. */
export interface InnerDoor extends Swing {
  /** The room the leaf swings into. */
  roomId: string;
  /**
   * The gap in the partition, to mask out of it. Null for a balcony door:
   * its glazed opening is already cut into the exterior wall.
   */
  cut: Box | null;
}

export interface PlanRoom {
  room: Room;
  /** 1-based, indoor rooms first — the same numbers as the explication list. */
  index: number;
  path: string;
  box: Box;
  /**
   * The room's clear floor for labels: `box` less the thick exterior wall on
   * the sides it runs along (partitions are allowed for in `labelMode`).
   */
  inner: Box;
  /** Area centroid, eased off the exterior walls: where the label goes when it clears the door swings. */
  center: Vec2;
  /** Door swings inside the room (entrance, its own door, a balcony door). */
  obstacles: Swing[];
  /**
   * The parts of the room clear of every swing, largest first — the label's
   * fallback places when it does not fit at the centre (`labelSpot`).
   */
  spots: { box: Box; center: Vec2 }[];
  outdoor: boolean;
}

export interface PlanGeometry {
  view: PlanView;
  outline: string;
  outlineBox: Box;
  rooms: PlanRoom[];
  windows: Opening[];
  /** Entrance door, cut into the exterior wall. */
  door: DoorMark | null;
  /** Interior doors and balcony doors. */
  doors: InnerDoor[];
}

/** Indoor rooms first (plan order), then balconies / terraces. */
export function orderedRooms(rooms: Room[]): Room[] {
  return [...rooms.filter((r) => !isOutdoor(r.type)), ...rooms.filter((r) => isOutdoor(r.type))];
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));
const boxCenter = (b: Box): Vec2 => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
const boxArea = (b: Box) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
const hits = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const clip = (a: Box, b: Box): Box => ({
  x0: Math.max(a.x0, b.x0),
  y0: Math.max(a.y0, b.y0),
  x1: Math.min(a.x1, b.x1),
  y1: Math.min(a.y1, b.y1),
});
const inBox = (b: Box, [x, y]: Vec2) => x >= b.x0 - EPS && x <= b.x1 + EPS && y >= b.y0 - EPS && y <= b.y1 + EPS;

/**
 * An open door: the leaf hinged at `hinge` and standing along `n` (into the
 * room it opens into), and its swing back to the far jamb along `t`.
 */
function swingOf(hinge: Vec2, t: Vec2, n: Vec2, len: number): Swing {
  const leafEnd: Vec2 = [hinge[0] + n[0] * len, hinge[1] + n[1] * len];
  const far: Vec2 = [hinge[0] + t[0] * len, hinge[1] + t[1] * len];
  // Sweep from the open leaf back to the far jamb; in y-down coordinates a
  // positive cross product n × t is clockwise (sweep-flag 1).
  const sweep = n[0] * t[1] - n[1] * t[0] > 0 ? 1 : 0;
  const xs = [hinge[0], leafEnd[0], far[0]];
  const ys = [hinge[1], leafEnd[1], far[1]];
  return {
    leaf: `M${r3(hinge[0])} ${r3(hinge[1])}L${r3(leafEnd[0])} ${r3(leafEnd[1])}`,
    arc: `M${r3(leafEnd[0])} ${r3(leafEnd[1])}A${len} ${len} 0 0 ${sweep} ${r3(far[0])} ${r3(far[1])}`,
    swing: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
    hinge,
    radius: len,
  };
}

/** Does box `a` reach into the swing's quarter disk, grown by `m`? (Exact: the disk ∩ its square is convex.) */
function hitsSwing(a: Box, s: Swing, m = 0): boolean {
  const sq = { x0: s.swing.x0 - m, y0: s.swing.y0 - m, x1: s.swing.x1 + m, y1: s.swing.y1 + m };
  const q = clip(a, sq);
  if (q.x1 <= q.x0 || q.y1 <= q.y0) return false;
  const [hx, hy] = s.hinge;
  const dx = Math.max(q.x0 - hx, 0, hx - q.x1);
  const dy = Math.max(q.y0 - hy, 0, hy - q.y1);
  return dx * dx + dy * dy < (s.radius + m) ** 2;
}

/**
 * The room box less the exterior wall where a side runs along the outline
 * (the wall is WALL thick; `labelMode` already allows for a partition).
 * A balcony loses the wall's outer half along the façade.
 */
function innerOf(b: Box, ob: Box, outdoor: boolean): Box {
  const d = (WALL - PARTITION) / 2;
  const on = (v: number, w: number) => Math.abs(v - w) < EPS;
  if (outdoor) return on(b.y1, ob.y0) ? { ...b, y1: b.y1 - d } : b;
  return {
    x0: on(b.x0, ob.x0) ? b.x0 + d : b.x0,
    x1: on(b.x1, ob.x1) ? b.x1 - d : b.x1,
    y0: on(b.y0, ob.y0) ? b.y0 + d : b.y0,
    y1: on(b.y1, ob.y1) ? b.y1 - d : b.y1,
  };
}

/**
 * Façade windows (and end-wall windows of corner apartments), plus the
 * glazed door onto the balcony or terrace: where outdoor space sits in front
 * of a room, its opening becomes a wider glazed door, one leaf of which is
 * drawn open into the room — hinged on the side of the nearer room corner.
 */
function windowsOf(rooms: PlanRoom[], ob: Box, corner: CornerSide): { windows: Opening[]; doors: InnerDoor[] } {
  const windows: Opening[] = [];
  const doors: InnerDoor[] = [];
  const outdoor = rooms.filter((r) => r.outdoor).map((r) => r.box);
  const habitable = rooms.filter((r) => !r.outdoor && Math.abs(r.box.y0 - ob.y0) < EPS);

  for (const r of habitable) {
    const b = r.box;
    const w = b.x1 - b.x0;
    const o = outdoor.find((x) => overlap(x.x0, x.x1, b.x0, b.x1) > 0.6);
    let c = (b.x0 + b.x1) / 2;
    let len = clamp(w * 0.5, 0.9, 2.1);
    if (o) {
      const lo = Math.max(b.x0, o.x0);
      const hi = Math.min(b.x1, o.x1);
      c = (lo + hi) / 2;
      len = Math.min((hi - lo) * 0.72, 3.2);
    }
    len = Math.min(len, w - 0.5);
    if (len <= 0.4) continue;
    const opening: Opening = { axis: 'h', a: c - len / 2, b: c + len / 2, at: ob.y0 };
    windows.push(opening);
    if (o) {
      const leaf = Math.min(DOOR_INNER, len);
      const fromLeft = opening.a - b.x0 <= b.x1 - opening.b;
      const hinge: Vec2 = [fromLeft ? opening.a : opening.b, ob.y0 + WALL / 2];
      doors.push({ ...swingOf(hinge, [fromLeft ? 1 : -1, 0], [0, 1], leaf), roomId: r.room.id, cut: null });
    }
  }

  // Corner apartments also look out of the end wall.
  const sides: ('left' | 'right')[] = corner === 'both' ? ['left', 'right'] : corner ? [corner] : [];
  for (const side of sides) {
    const x = side === 'left' ? ob.x0 : ob.x1;
    for (const { box: b } of habitable) {
      const touches = side === 'left' ? Math.abs(b.x0 - x) < EPS : Math.abs(b.x1 - x) < EPS;
      if (!touches) continue;
      const h = b.y1 - b.y0;
      const c = (b.y0 + b.y1) / 2;
      const len = clamp(h * 0.4, 0.9, 1.8);
      windows.push({ axis: 'v', a: c - len / 2, b: c + len / 2, at: x });
    }
  }
  return { windows, doors };
}

function doorOf(entrance: Vec2, ob: Box): DoorMark {
  const [ex, ey] = entrance;
  // Which outline edge the entrance sits on → the edge direction t and the
  // inward normal n.
  let t: Vec2 = [1, 0];
  let n: Vec2 = [0, -1];
  if (Math.abs(ey - ob.y0) < EPS) n = [0, 1];
  else if (Math.abs(ex - ob.x0) < EPS) {
    t = [0, 1];
    n = [1, 0];
  } else if (Math.abs(ex - ob.x1) < EPS) {
    t = [0, 1];
    n = [-1, 0];
  }
  const half = DOOR / 2;
  const inner = WALL / 2;
  const hinge: Vec2 = [ex - t[0] * half + n[0] * inner, ey - t[1] * half + n[1] * inner];
  const cut: Box = {
    x0: Math.min(ex - t[0] * half, ex + t[0] * half) - Math.abs(n[0]) * (inner + 0.01),
    x1: Math.max(ex - t[0] * half, ex + t[0] * half) + Math.abs(n[0]) * (inner + 0.01),
    y0: Math.min(ey - t[1] * half, ey + t[1] * half) - Math.abs(n[1]) * (inner + 0.01),
    y1: Math.max(ey - t[1] * half, ey + t[1] * half) + Math.abs(n[1]) * (inner + 0.01),
  };
  return { ...swingOf(hinge, t, n, DOOR), cut, label: [ex - n[0] * 0.5, ey - n[1] * 0.5] };
}

/** An axis-aligned stretch of wall: along x (h) or y (v), from a to b, on the line `at`. */
interface Segment {
  axis: 'h' | 'v';
  at: number;
  a: number;
  b: number;
}

function edgesOf(p: Polygon): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    if (Math.abs(y1 - y2) < EPS) out.push({ axis: 'h', at: (y1 + y2) / 2, a: Math.min(x1, x2), b: Math.max(x1, x2) });
    else if (Math.abs(x1 - x2) < EPS) out.push({ axis: 'v', at: (x1 + x2) / 2, a: Math.min(y1, y2), b: Math.max(y1, y2) });
  }
  return out;
}

/** The longest wall two rooms share (axis-aligned edges on one line), or null. */
function sharedWall(p: Polygon, q: Polygon): Segment | null {
  let best: Segment | null = null;
  for (const e of edgesOf(p)) {
    for (const f of edgesOf(q)) {
      if (e.axis !== f.axis || Math.abs(e.at - f.at) > EPS) continue;
      const a = Math.max(e.a, f.a);
      const b = Math.min(e.b, f.b);
      if (b - a > (best ? best.b - best.a : 0)) best = { axis: e.axis, at: e.at, a, b };
    }
  }
  return best;
}

/**
 * What it costs to walk THROUGH a room to reach another: the hall is free, a
 * living room nearly so, a bedroom only as a last resort, a bathroom never.
 */
const THROUGH: Partial<Record<RoomType, number>> = {
  hall: 0,
  living: 1,
  'kitchen-living': 1,
  kitchen: 2,
  storage: 4,
  bedroom: 6,
};

/** A door on the wall `w`, as near to `anchor` as the wall allows, swinging into `into`. */
function doorOn(w: Segment, anchor: Vec2, into: Box, roomId: string): { door: InnerDoor; at: Vec2 } {
  const len = DOOR_INNER;
  const m = clamp(w.axis === 'h' ? anchor[0] : anchor[1], w.a + JAMB + len / 2, w.b - JAMB - len / 2);
  // Hinged on the side of the nearer corner, so the open leaf rests towards it.
  const dir = m - w.a <= w.b - m ? 1 : -1;
  const hingeAlong = m - (dir * len) / 2;
  const [cx, cy] = boxCenter(into);
  const side = (w.axis === 'h' ? cy : cx) >= w.at ? 1 : -1;
  const face = w.at + (side * PARTITION) / 2;
  const h = w.axis === 'h';
  const swing = swingOf(h ? [hingeAlong, face] : [face, hingeAlong], h ? [dir, 0] : [0, dir], h ? [0, side] : [side, 0], len);
  const cut: Box = h
    ? { x0: m - len / 2, x1: m + len / 2, y0: w.at - CUT, y1: w.at + CUT }
    : { x0: w.at - CUT, x1: w.at + CUT, y0: m - len / 2, y1: m + len / 2 };
  return { door: { ...swing, roomId, cut }, at: h ? [m, w.at] : [w.at, m] };
}

/**
 * Interior doors, derived from the room layout (the data has no doors yet):
 * every indoor room gets one door, onto the room it is best reached from —
 * the cheapest walk from the entrance hall over shared walls long enough for
 * a door (Dijkstra with the THROUGH costs, so bathrooms open off the hall,
 * bedrooms off the hall or the living room, a dressing room off its
 * bedroom). Each door sits on its wall as near as it can to where one comes
 * in — the entrance, or the door of the room before — and swings into the
 * room it serves.
 *
 * When plans come from the architect's drawings, explicit doors in `plan2D`
 * replace this; the drawing code reads `InnerDoor`s either way.
 */
function innerDoors(rooms: PlanRoom[], entrance: Vec2 | null): InnerDoor[] {
  const indoor = rooms.filter((r) => !r.outdoor);
  const count = indoor.length;
  if (count < 2) return [];
  const hall =
    (entrance && indoor.find((r) => r.room.type === 'hall' && inBox(r.box, entrance))) ||
    (entrance && indoor.find((r) => inBox(r.box, entrance))) ||
    indoor.find((r) => r.room.type === 'hall') ||
    indoor[0];
  const start = indoor.indexOf(hall);
  const walls = indoor.map((p) => indoor.map((q) => (p === q ? null : sharedWall(p.room.polygon, q.room.polygon))));
  const minWall = DOOR_INNER + JAMB * 2;

  const cost: number[] = indoor.map(() => Infinity);
  const from: (number | null)[] = indoor.map(() => null);
  const via: (Segment | null)[] = indoor.map(() => null);
  const done: boolean[] = indoor.map(() => false);
  const order: number[] = [];
  cost[start] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < count; i += 1) if (!done[i] && cost[i] < Infinity && (u < 0 || cost[i] < cost[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    order.push(u);
    const through = u === start ? 0 : (THROUGH[indoor[u].room.type] ?? Infinity);
    if (through === Infinity) continue;
    for (let v = 0; v < count; v += 1) {
      const w = walls[u][v];
      if (done[v] || !w || w.b - w.a < minWall) continue;
      const c = cost[u] + through;
      const prev = via[v];
      if (c < cost[v] || (c === cost[v] && prev && w.b - w.a > prev.b - prev.a)) {
        cost[v] = c;
        from[v] = u;
        via[v] = w;
      }
    }
  }

  const doors: InnerDoor[] = [];
  const entry: Vec2[] = indoor.map((r) => boxCenter(r.box));
  if (entrance) entry[start] = entrance;
  for (const v of order) {
    const u = from[v];
    const w = via[v];
    if (u === null || !w) continue;
    const { door, at } = doorOn(w, entry[u], indoor[v].box, indoor[v].room.id);
    doors.push(door);
    entry[v] = at;
  }
  return doors;
}

/**
 * The parts of a room clear of the given swings (each grown by a small
 * margin): every maximal rectangle left beside, above or below each swing,
 * largest first. The whole room when nothing is in the way.
 */
function clearAreas(b: Box, obstacles: Box[]): Box[] {
  const m = 0.1;
  let parts: Box[] = [b];
  for (const raw of obstacles) {
    const o = { x0: raw.x0 - m, y0: raw.y0 - m, x1: raw.x1 + m, y1: raw.y1 + m };
    parts = parts.flatMap((c) => {
      if (!hits(c, o)) return [c];
      const out: Box[] = [];
      if (o.y0 > c.y0) out.push({ ...c, y1: o.y0 });
      if (o.y1 < c.y1) out.push({ ...c, y0: o.y1 });
      if (o.x0 > c.x0) out.push({ ...c, x1: o.x0 });
      if (o.x1 < c.x1) out.push({ ...c, x0: o.x1 });
      return out;
    });
  }
  return parts.filter((c) => c.x1 - c.x0 > 0.4 && c.y1 - c.y0 > 0.4).sort((p, q) => boxArea(q) - boxArea(p));
}

export function planGeometry(plan: ApartmentPlan2D, corner: CornerSide = null): PlanGeometry {
  const ob = bbox(plan.outline);
  const rooms: PlanRoom[] = orderedRooms(plan.rooms).map((room, i) => {
    const box = bbox(room.polygon);
    const outdoor = isOutdoor(room.type);
    const inner = innerOf(box, ob, outdoor);
    const [cx, cy] = centroid(room.polygon);
    return {
      room,
      index: i + 1,
      path: pathOf(room.polygon),
      box,
      inner,
      center: [cx + (inner.x0 - box.x0 - (box.x1 - inner.x1)) / 2, cy + (inner.y0 - box.y0 - (box.y1 - inner.y1)) / 2],
      obstacles: [],
      spots: [],
      outdoor,
    };
  });
  const { windows, doors: balconyDoors } = windowsOf(rooms, ob, corner);
  const door = plan.entrance ? doorOf(plan.entrance, ob) : null;
  const doors = [...innerDoors(rooms, plan.entrance ?? null), ...balconyDoors];

  for (const r of rooms) {
    if (r.outdoor) {
      r.spots = [{ box: r.inner, center: r.center }];
      continue;
    }
    r.obstacles = [
      ...(door && boxArea(clip(door.swing, r.box)) > 0.01 ? [door] : []),
      ...doors.filter((d) => d.roomId === r.room.id),
    ];
    const clear = clearAreas(
      r.inner,
      r.obstacles.map((o) => o.swing),
    );
    r.spots = clear.length ? clear.map((b) => ({ box: b, center: boxCenter(b) })) : [{ box: r.inner, center: r.center }];
  }

  return {
    view: planView(plan),
    outline: pathOf(plan.outline),
    outlineBox: ob,
    rooms,
    windows,
    door,
    doors,
  };
}

export type LabelMode = 'full' | 'area' | 'index' | 'none';

type LabelFont = { name: number; area: number };

/**
 * Estimated rendered label width (px) of a name in small caps (measured:
 * 0.85–0.89 em per Cyrillic capital with the .label tracking) and of an area
 * figure.
 */
const nameWidth = (name: string, font: LabelFont) => name.length * 0.88 * font.name;
const areaWidth = (area: string, font: LabelFont) => area.length * 0.58 * font.area;
const fullHeight = (font: LabelFont) => font.name * 1.25 + 4 + font.area * 1.15;

/**
 * How much of a room's label fits at a drawing scale of `k` px per metre:
 * name over area, area alone, the room's number, or nothing. Text widths are
 * estimates of the rendered label — generous, so a label steps down a mode
 * rather than touching a wall.
 */
export function labelMode(box: Box, k: number, name: string, area: string, font: LabelFont): LabelMode {
  const w = (box.x1 - box.x0 - PARTITION) * k - 10;
  const h = (box.y1 - box.y0 - PARTITION) * k - 8;
  const nameW = nameWidth(name, font);
  const areaW = areaWidth(area, font);
  if (nameW <= w && areaW <= w && h >= fullHeight(font)) return 'full';
  if (areaW <= w && h >= font.area * 1.3) return 'area';
  if (w >= 18 && h >= 16) return 'index';
  return 'none';
}

const MODE_RANK: Record<LabelMode, number> = { full: 3, area: 2, index: 1, none: 0 };
const STEP_DOWN: LabelMode[] = ['full', 'area', 'index'];

/** The label's own box, in metres, centred on `c` (with a few px of air). */
function labelBox(c: Vec2, mode: LabelMode, k: number, name: string, area: string, font: LabelFont): Box {
  const px =
    mode === 'full'
      ? [Math.max(nameWidth(name, font), areaWidth(area, font)), fullHeight(font)]
      : mode === 'area'
        ? [areaWidth(area, font), font.area * 1.3]
        : [18, 16];
  const w = (px[0] + 8) / k / 2;
  const h = (px[1] + 6) / k / 2;
  return { x0: c[0] - w, y0: c[1] - h, x1: c[0] + w, y1: c[1] + h };
}

/**
 * The room's best label at this scale. First choice: centred on the room,
 * in the fullest form that clears every door swing. Otherwise the first
 * clear part of the room that gives a fuller label.
 */
export function labelSpot(
  r: PlanRoom,
  k: number,
  name: string,
  area: string,
  font: LabelFont,
): { mode: LabelMode; center: Vec2 } {
  let best: { mode: LabelMode; center: Vec2 } = { mode: 'none', center: r.center };
  const whole = labelMode(r.inner, k, name, area, font);
  if (whole !== 'none') {
    for (const mode of STEP_DOWN.slice(STEP_DOWN.indexOf(whole))) {
      const lb = labelBox(r.center, mode, k, name, area, font);
      if (!r.obstacles.some((o) => hitsSwing(lb, o, 0.05))) {
        best = { mode, center: r.center };
        break;
      }
    }
  }
  if (best.mode === 'full') return best;
  for (const s of r.spots) {
    const mode = labelMode(s.box, k, name, area, font);
    if (MODE_RANK[mode] > MODE_RANK[best.mode]) best = { mode, center: s.center };
    if (mode === 'full') break;
  }
  return best;
}

/** Wall-cut rectangle for a window (covers the wall's full thickness). */
export function openingCut(o: Opening): Box {
  const h = WALL / 2 + 0.01;
  return o.axis === 'h'
    ? { x0: o.a, x1: o.b, y0: o.at - h, y1: o.at + h }
    : { x0: o.at - h, x1: o.at + h, y0: o.a, y1: o.b };
}

/** Window symbol: the two wall faces and the glazing line, as one path. */
export function openingLines(o: Opening): string {
  const h = WALL / 2;
  if (o.axis === 'h') {
    const [a, b, y] = [r3(o.a), r3(o.b), o.at];
    return `M${a} ${r3(y - h)}H${b}M${a} ${r3(y)}H${b}M${a} ${r3(y + h)}H${b}M${a} ${r3(y - h)}V${r3(y + h)}M${b} ${r3(y - h)}V${r3(y + h)}`;
  }
  const [a, b, x] = [r3(o.a), r3(o.b), o.at];
  return `M${r3(x - h)} ${a}V${b}M${r3(x)} ${a}V${b}M${r3(x + h)} ${a}V${b}M${r3(x - h)} ${a}H${r3(x + h)}M${r3(x - h)} ${b}H${r3(x + h)}`;
}
