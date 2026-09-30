/**
 * Elevation geometry for step 2, derived from the inventory — nothing is
 * drawn by hand. Windows sit where the plan has habitable rooms on the façade,
 * French doors and balcony slabs where the plan has a balcony or terrace, the
 * lift overrun above the core. Change the plates or plans and the elevation
 * follows; a 3D scene can extrude the same numbers.
 *
 * Units are metres in SVG space: x along the façade, y DOWN from the ground
 * line (a storey at height z is drawn at y = -z).
 *
 *   long  the long (south) façade, looking north — x = plate x.
 *   end   the west end façade — x = plate y, north on the left, balconies
 *         of both long façades seen in profile. Used on touch screens and
 *         narrow windows: the narrow end keeps every storey ≥ 44 px tall.
 */
import type { Apartment, Building, FloorPlate, Polygon, ProjectInventory, RoomType } from '@/lib/inventory/types';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FacadeOpening extends Box {
  /** French door onto a balcony (full height) rather than a window. */
  door: boolean;
}

export interface FacadeProjection {
  slab: Box;
  rail: Box;
}

export interface FacadeFloor {
  floor: number;
  residential: boolean;
  /** Storey rectangle across the façade. */
  band: Box;
  openings: FacadeOpening[];
  projections: FacadeProjection[];
}

export interface FacadeGeometry {
  kind: 'long' | 'end';
  view: Box;
  /** Building mass (the storeys, without the parapet). */
  mass: Box;
  parapet: Box;
  overrun: Box | null;
  ground: { x0: number; x1: number; depth: number };
  /** Ascending, ground floor first. */
  floors: FacadeFloor[];
  /** Level numbers: right edge (text-anchor end). */
  labelX: number;
  /** Where the side tag column starts (long façade: the view's right edge). */
  tagX: number;
  /** Interactive band extent along x (includes the level number). */
  hitX0: number;
  hitX1: number;
  /** Baseline of the quiet ground-floor note under the ground line. */
  groundLabel: { x: number; y: number };
}

const OUTDOOR: ReadonlySet<RoomType> = new Set<RoomType>(['balcony', 'terrace']);
const PARAPET = 0.9;
const OVERRUN = 2.7;
const EARTH = 0.9;
const SILL = 0.9;
const HEAD = 2.45;
const SLAB = 0.12;
const RAIL = 1.05;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function bounds(p: Polygon) {
  const xs = p.map((v) => v[0]);
  const ys = p.map((v) => v[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

function plateFor(inv: ProjectInventory, b: Building, floor: number): FloorPlate | undefined {
  const id = b.floorPlates[floor];
  return id ? inv.plates.find((p) => p.id === id) : undefined;
}

function apartmentAt(inv: ProjectInventory, b: Building, floor: number, slot: string): Apartment | undefined {
  return inv.apartments.find((a) => a.buildingId === b.id && a.floor === floor && a.slot === slot);
}

/** y of the façade line in the apartment's own frame (outdoor space above it). */
function facadeLine(a: Apartment) {
  return Math.min(...a.plan2D.outline.map((p) => p[1]));
}

/** Habitable rooms touching the façade, and the outdoor spaces, in the apartment frame. */
function facadeRooms(a: Apartment) {
  const top = facadeLine(a);
  const rooms = a.plan2D.rooms
    .filter((r) => !OUTDOOR.has(r.type))
    .map((r) => bounds(r.polygon))
    .filter((bb) => Math.abs(bb.y0 - top) < 0.05);
  const outdoor = a.plan2D.rooms.filter((r) => OUTDOOR.has(r.type)).map((r) => bounds(r.polygon));
  return { top, rooms, outdoor };
}

/** Window (or French door) of a storey whose floor is at z0, centred on cx. */
function opening(cx: number, roomWidth: number, z0: number, door: boolean): FacadeOpening {
  const w = clamp(roomWidth * (door ? 0.5 : 0.42), 0.9, door ? 2.6 : 1.9);
  const zTop = z0 + HEAD;
  const zBottom = z0 + (door ? SLAB + 0.02 : SILL);
  return { x: cx - w / 2, y: -zTop, w, h: zTop - zBottom, door };
}

function projection(x: number, w: number, z0: number): FacadeProjection {
  return {
    slab: { x, y: -(z0 + SLAB), w, h: SLAB + 0.1 },
    rail: { x, y: -(z0 + SLAB + RAIL), w, h: RAIL },
  };
}

/** Shop-front glazing of a non-residential storey, one bay per ~4.4 m. */
function groundBays(width: number, z0: number, h: number, doorAt: number | null): FacadeOpening[] {
  const n = Math.max(2, Math.round(width / 4.4));
  const bay = width / n;
  const out: FacadeOpening[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = i * bay + 0.4;
    const door = doorAt !== null && doorAt >= i * bay && doorAt < (i + 1) * bay;
    const zTop = z0 + h - 0.6;
    out.push({ x, y: -zTop, w: bay - 0.8, h: zTop - (z0 + (door ? 0 : 0.35)), door });
  }
  return out;
}

export function longElevation(inv: ProjectInventory, b: Building): FacadeGeometry {
  const W = b.footprint.w;
  const h = b.storeyHeight;
  const roof = b.floorsCount * h;
  const anyPlate = plateFor(inv, b, Object.keys(b.floorPlates).map(Number).sort((x, y) => x - y)[0]);
  const floors: FacadeFloor[] = [];

  for (let f = 1; f <= b.floorsCount; f += 1) {
    const z0 = (f - 1) * h;
    const band: Box = { x: 0, y: -(z0 + h), w: W, h };
    const plate = plateFor(inv, b, f);
    const openings: FacadeOpening[] = [];
    const projections: FacadeProjection[] = [];

    if (!plate) {
      const core = anyPlate?.core;
      openings.push(...groundBays(W, z0, h, core ? core.x + core.w / 2 : null));
    } else {
      for (const s of plate.slots.filter((sl) => sl.facade === 'south')) {
        const a = apartmentAt(inv, b, f, s.id);
        if (!a) continue;
        const { rooms, outdoor } = facadeRooms(a);
        for (const r of rooms) {
          const cx = (r.x0 + r.x1) / 2;
          const door = outdoor.some((o) => cx > o.x0 && cx < o.x1);
          openings.push(opening(s.rect.x + cx, r.x1 - r.x0, z0, door));
        }
        for (const o of outdoor) projections.push(projection(s.rect.x + o.x0, o.x1 - o.x0, z0));
      }
    }
    floors.push({ floor: f, residential: !!plate, band, openings, projections });
  }

  const L = 3.2;
  // Just room for the leader: the side tag lives in its own HTML column of a
  // fixed measure beyond the drawing (see Facade2D), so long words never
  // depend on how wide the drawing happens to be.
  const R = 2.8;
  const top = roof + OVERRUN + 0.8;
  const bottom = EARTH + 2.1;
  const core = anyPlate?.core;
  return {
    kind: 'long',
    view: { x: -L, y: -top, w: W + L + R, h: top + bottom },
    mass: { x: 0, y: -roof, w: W, h: roof },
    parapet: { x: 0, y: -(roof + PARAPET), w: W, h: PARAPET },
    overrun: core ? { x: core.x, y: -(roof + OVERRUN), w: core.w, h: OVERRUN } : null,
    ground: { x0: -2.2, x1: W + 2.2, depth: EARTH },
    floors,
    labelX: -1.1,
    tagX: W + R,
    hitX0: -L + 0.3,
    hitX1: W + 0.4,
    groundLabel: { x: 0, y: EARTH + 1.35 },
  };
}

export function endElevation(inv: ProjectInventory, b: Building): FacadeGeometry {
  const D = b.footprint.h;
  const h = b.storeyHeight;
  const roof = b.floorsCount * h;
  const anyPlate = plateFor(inv, b, Object.keys(b.floorPlates).map(Number).sort((x, y) => x - y)[0]);
  const floors: FacadeFloor[] = [];
  let pN = 0;
  let pS = 0;

  for (let f = 1; f <= b.floorsCount; f += 1) {
    const z0 = (f - 1) * h;
    const band: Box = { x: 0, y: -(z0 + h), w: D, h };
    const plate = plateFor(inv, b, f);
    const openings: FacadeOpening[] = [];
    const projections: FacadeProjection[] = [];

    if (!plate) {
      const c = anyPlate?.corridor;
      openings.push(...groundBays(D, z0, h, c ? c.y + c.h / 2 : null));
    } else {
      // Corridor end: a narrow full-height window.
      const c = plate.corridor;
      openings.push({ x: c.y + c.h / 2 - 0.45, y: -(z0 + HEAD), w: 0.9, h: HEAD - 0.3, door: false });

      const west = Math.min(...plate.slots.map((s) => s.rect.x));
      let dN = 0;
      let dS = 0;
      for (const s of plate.slots) {
        const a = apartmentAt(inv, b, f, s.id);
        if (!a) continue;
        const { top, rooms, outdoor } = facadeRooms(a);
        const depth = outdoor.length ? top : 0;
        if (s.facade === 'north') dN = Math.max(dN, depth);
        else dS = Math.max(dS, depth);
        if (s.rect.x !== west) continue;
        // The corner room on the west end gets a window in the gable.
        const end = rooms.find((r) => r.x0 < 0.05);
        if (!end) continue;
        const [y0, y1] =
          s.facade === 'north'
            ? [s.rect.y + (end.y0 - top), s.rect.y + (end.y1 - top)]
            : [s.rect.y + s.rect.h - (end.y1 - top), s.rect.y + s.rect.h - (end.y0 - top)];
        openings.push(opening((y0 + y1) / 2, y1 - y0, z0, false));
      }
      if (dN > 0) projections.push(projection(-dN, dN, z0));
      if (dS > 0) projections.push(projection(D, dS, z0));
      pN = Math.max(pN, dN);
      pS = Math.max(pS, dS);
    }
    floors.push({ floor: f, residential: !!plate, band, openings, projections });
  }

  const L = pN + 2.3;
  const R = pS + 0.5;
  const top = roof + OVERRUN + 0.8;
  const bottom = EARTH + 2.1;
  const core = anyPlate?.core;
  return {
    kind: 'end',
    view: { x: -L, y: -top, w: D + L + R, h: top + bottom },
    mass: { x: 0, y: -roof, w: D, h: roof },
    parapet: { x: 0, y: -(roof + PARAPET), w: D, h: PARAPET },
    overrun: core ? { x: core.y, y: -(roof + OVERRUN), w: core.h, h: OVERRUN } : null,
    ground: { x0: -L + 0.3, x1: D + R, depth: EARTH },
    floors,
    labelX: -(pN + 0.7),
    tagX: D + pS + 0.6,
    hitX0: -L + 0.2,
    hitX1: D + pS,
    groundLabel: { x: -L + 0.3, y: EARTH + 1.35 },
  };
}
