/**
 * Parametric 2D apartment plans.
 *
 * A floor-plate slot is a rectangle (width along the corridor × depth to the
 * façade). The plan splits it into two bands — service rooms on the corridor
 * side (hall, bathrooms, storage) and habitable rooms along the façade — and
 * hangs the balcony or terrace outside the façade. Because every room is cut
 * from the slot, room areas always add up to the apartment area.
 *
 * Coordinates are metres in the apartment's own frame: x left→right, y from
 * the outdoor space's outer edge (top when drawn) down to the corridor
 * (entrance, bottom). A future 3D scene can extrude these same polygons.
 *
 * Replace with real drawings by giving an apartment an `ApartmentPlan2D` from
 * the architect's CAD export — the views only read `plan2D`, never this file.
 */
import type { ApartmentPlan2D, ApartmentType, OutdoorType, Polygon, Room, RoomType } from './types';

interface Band {
  type: RoomType;
  weight: number;
}

/** Façade-side (habitable) band, left → right. */
function outerBand(rooms: number, type: ApartmentType): Band[] {
  if (rooms <= 1)
    return [
      { type: 'living', weight: 0.58 },
      { type: 'kitchen', weight: 0.42 },
    ];
  if (rooms === 2)
    return [
      { type: 'bedroom', weight: 0.36 },
      { type: 'living', weight: 0.36 },
      { type: 'kitchen', weight: 0.28 },
    ];
  if (rooms === 3)
    return [
      { type: 'bedroom', weight: 0.3 },
      { type: 'kitchen-living', weight: 0.4 },
      { type: 'bedroom', weight: 0.3 },
    ];
  if (type === 'penthouse')
    return [
      { type: 'bedroom', weight: 0.23 },
      { type: 'kitchen-living', weight: 0.37 },
      { type: 'bedroom', weight: 0.2 },
      { type: 'bedroom', weight: 0.2 },
    ];
  return [
    { type: 'bedroom', weight: 0.24 },
    { type: 'kitchen-living', weight: 0.34 },
    { type: 'bedroom', weight: 0.21 },
    { type: 'bedroom', weight: 0.21 },
  ];
}

/** Corridor-side (service) band, left → right. */
function innerBand(rooms: number): Band[] {
  if (rooms <= 1)
    return [
      { type: 'bathroom', weight: 0.36 },
      { type: 'hall', weight: 0.64 },
    ];
  if (rooms === 2)
    return [
      { type: 'bathroom', weight: 0.3 },
      { type: 'hall', weight: 0.45 },
      { type: 'storage', weight: 0.25 },
    ];
  return [
    { type: 'bathroom', weight: 0.24 },
    { type: 'hall', weight: 0.34 },
    { type: 'bathroom', weight: 0.2 },
    { type: 'storage', weight: 0.22 },
  ];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

function rect(x: number, y: number, w: number, h: number): Polygon {
  return [
    [round2(x), round2(y)],
    [round2(x + w), round2(y)],
    [round2(x + w), round2(y + h)],
    [round2(x), round2(y + h)],
  ];
}

/** Shoelace area of a polygon, m². */
export function polygonArea(p: Polygon): number {
  let a = 0;
  for (let i = 0; i < p.length; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function split(total: number, bands: Band[]): number[] {
  const sum = bands.reduce((s, b) => s + b.weight, 0);
  return bands.map((b) => (total * b.weight) / sum);
}

export interface PlanSpec {
  /** Slot width along the corridor, m. */
  width: number;
  /** Slot depth corridor → façade, m. */
  depth: number;
  rooms: number;
  type: ApartmentType;
  outdoor: OutdoorType;
}

export function generatePlan(spec: PlanSpec): { plan: ApartmentPlan2D; area: number; outdoorArea: number; bathrooms: number } {
  const { width: w, depth: d, rooms: n, type, outdoor } = spec;
  const outdoorDepth = outdoor === 'terrace' ? 2.6 : outdoor === 'balcony' ? 1.4 : 0;
  const top = outdoorDepth; // indoor area starts below the outdoor strip
  const inner = Math.min(2.6, d * 0.38);
  const outerDepth = d - inner;

  const result: Room[] = [];
  let i = 0;
  const push = (t: RoomType, poly: Polygon) => {
    i += 1;
    result.push({ id: `r${i}`, type: t, polygon: poly, area: round1(polygonArea(poly)) });
  };

  // Habitable band along the façade.
  const outer = outerBand(n, type);
  const outerW = split(w, outer);
  let x = 0;
  const outerRects: { type: RoomType; x: number; w: number }[] = [];
  outer.forEach((b, k) => {
    push(b.type, rect(x, top, outerW[k], outerDepth));
    outerRects.push({ type: b.type, x, w: outerW[k] });
    x += outerW[k];
  });

  // Service band on the corridor side.
  const innerB = innerBand(n);
  const innerW = split(w, innerB);
  x = 0;
  innerB.forEach((b, k) => {
    push(b.type, rect(x, top + outerDepth, innerW[k], inner));
    x += innerW[k];
  });

  // Outdoor space outside the façade, centred on the main living room.
  let outdoorArea = 0;
  if (outdoor !== 'none') {
    const main = outerRects.find((r) => r.type === 'kitchen-living' || r.type === 'living') ?? outerRects[0];
    const ow = outdoor === 'terrace' ? Math.min(w * 0.7, main.w + 6) : Math.min(main.w * 0.95, 4.4);
    const ox = Math.min(Math.max(main.x + main.w / 2 - ow / 2, 0), w - ow);
    const poly = rect(ox, 0, ow, outdoorDepth);
    push(outdoor, poly);
    outdoorArea = round1(polygonArea(poly));
  }

  const indoor = result.filter((r) => r.type !== 'balcony' && r.type !== 'terrace');
  const area = round1(indoor.reduce((s, r) => s + r.area, 0));
  const bathrooms = result.filter((r) => r.type === 'bathroom' || r.type === 'wc').length;

  // Entrance: middle of the hall's corridor edge.
  const hallIdx = innerB.findIndex((b) => b.type === 'hall');
  const hallX = innerW.slice(0, hallIdx).reduce((s, v) => s + v, 0) + innerW[hallIdx] / 2;

  return {
    plan: {
      size: [round2(w), round2(top + d)],
      outline: rect(0, top, w, d),
      rooms: result,
      entrance: [round2(hallX), round2(top + d)],
    },
    area,
    outdoorArea,
    bathrooms,
  };
}
