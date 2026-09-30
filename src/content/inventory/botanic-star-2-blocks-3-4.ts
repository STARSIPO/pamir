/**
 * DEMO INVENTORY — Botanic Star 2, blocks 3 and 4.
 *
 * Invented for demonstration at the client's request (2026-09-30): the real
 * stock sheet (block, floor, unit no., rooms, m², status, price) has not been
 * supplied. `demo: true` puts a visible notice on every inventory page and
 * marks them noindex. Replace this module with the real data — same shape —
 * and set `demo: false`. Floor counts here are NOT the confirmed figures
 * (content/projects.ts still lists storeys as "Уточняется").
 *
 * Only the structure is authored by hand (plates, slots, buildings); units are
 * generated deterministically so the demo is stable across builds.
 *
 * Room counts stay inside the published facts («Типы квартир: 1–3 комнаты»,
 * content/projects.ts): the wide corner units and the penthouses are large
 * 3-room flats, not 4-room ones. Selector chips, the calculator's room choice
 * (pricing.json roomCoefficients) and the recommender all derive from this.
 */
import type { Apartment, Building, FeatureKey, FloorPlate, FloorSlot, ProjectInventory } from '@/lib/inventory/types';
import { generatePlan } from '@/lib/inventory/plan-generator';
import { estimate } from '@/lib/pricing/engine';

const PROJECT = 'botanic-star-2-blocks-3-4';

/** Slot helper: rectangle on the plate + what goes in it. */
function slot(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  facade: FloorSlot['facade'],
  rooms: number,
  type: FloorSlot['type'],
  outdoor: FloorSlot['outdoor'],
  features: FeatureKey[] = [],
): FloorSlot {
  return { id, rect: { x, y, w, h }, facade, rooms, type, outdoor, features };
}

// Plate geometry: 16.6 m deep, 1.8 m central corridor, 7.4 m deep units.
const D = 7.4;
const CORRIDOR_Y = D;
const SOUTH_Y = D + 1.8;
const PLATE_DEPTH = D * 2 + 1.8;

const plates: FloorPlate[] = [
  {
    id: 'b3-typical',
    size: [40, PLATE_DEPTH],
    core: { x: 21.8, y: 0, w: 5.6, h: D },
    corridor: { x: 0, y: CORRIDOR_Y, w: 40, h: 1.8 },
    slots: [
      slot('n1', 0, 0, 13.2, D, 'north', 3, 'corner', 'balcony', ['corner']),
      slot('n2', 13.2, 0, 8.6, D, 'north', 2, 'standard', 'balcony'),
      slot('n3', 27.4, 0, 6.2, D, 'north', 1, 'standard', 'balcony'),
      slot('n4', 33.6, 0, 6.4, D, 'north', 1, 'corner', 'balcony', ['corner']),
      slot('s1', 0, SOUTH_Y, 11.4, D, 'south', 3, 'corner', 'balcony', ['corner', 'courtyard-view']),
      slot('s2', 11.4, SOUTH_Y, 8.6, D, 'south', 2, 'standard', 'balcony', ['courtyard-view']),
      slot('s3', 20.0, SOUTH_Y, 8.6, D, 'south', 2, 'standard', 'balcony', ['courtyard-view']),
      slot('s4', 28.6, SOUTH_Y, 11.4, D, 'south', 3, 'corner', 'balcony', ['corner', 'courtyard-view']),
    ],
  },
  {
    id: 'b3-top',
    size: [40, PLATE_DEPTH],
    core: { x: 21.8, y: 0, w: 5.6, h: D },
    corridor: { x: 0, y: CORRIDOR_Y, w: 40, h: 1.8 },
    slots: [
      slot('n1', 0, 0, 21.8, D, 'north', 3, 'penthouse', 'terrace', ['corner']),
      slot('n2', 27.4, 0, 12.6, D, 'north', 3, 'corner', 'balcony', ['corner']),
      slot('s1', 0, SOUTH_Y, 20.0, D, 'south', 3, 'penthouse', 'terrace', ['corner', 'courtyard-view']),
      slot('s2', 20.0, SOUTH_Y, 11.4, D, 'south', 3, 'standard', 'balcony', ['courtyard-view']),
      slot('s3', 31.4, SOUTH_Y, 8.6, D, 'south', 2, 'corner', 'balcony', ['corner', 'courtyard-view']),
    ],
  },
  {
    id: 'b4-typical',
    size: [34, PLATE_DEPTH],
    core: { x: 20.0, y: 0, w: 5.6, h: D },
    corridor: { x: 0, y: CORRIDOR_Y, w: 34, h: 1.8 },
    slots: [
      slot('n1', 0, 0, 11.4, D, 'north', 3, 'corner', 'balcony', ['corner', 'courtyard-view']),
      slot('n2', 11.4, 0, 8.6, D, 'north', 2, 'standard', 'balcony', ['courtyard-view']),
      slot('n3', 25.6, 0, 8.4, D, 'north', 2, 'corner', 'balcony', ['corner', 'courtyard-view']),
      slot('s1', 0, SOUTH_Y, 8.6, D, 'south', 2, 'corner', 'balcony', ['corner', 'street-view']),
      slot('s2', 8.6, SOUTH_Y, 6.2, D, 'south', 1, 'standard', 'balcony', ['street-view']),
      slot('s3', 14.8, SOUTH_Y, 6.2, D, 'south', 1, 'standard', 'balcony', ['street-view']),
      slot('s4', 21.0, SOUTH_Y, 13.0, D, 'south', 3, 'corner', 'balcony', ['corner', 'street-view']),
    ],
  },
  {
    id: 'b4-top',
    size: [34, PLATE_DEPTH],
    core: { x: 20.0, y: 0, w: 5.6, h: D },
    corridor: { x: 0, y: CORRIDOR_Y, w: 34, h: 1.8 },
    slots: [
      slot('n1', 0, 0, 20.0, D, 'north', 3, 'penthouse', 'terrace', ['corner', 'courtyard-view']),
      slot('n2', 25.6, 0, 8.4, D, 'north', 2, 'corner', 'balcony', ['corner', 'courtyard-view']),
      slot('s1', 0, SOUTH_Y, 14.8, D, 'south', 3, 'corner', 'balcony', ['corner', 'street-view']),
      slot('s2', 14.8, SOUTH_Y, 19.2, D, 'south', 3, 'penthouse', 'terrace', ['corner', 'street-view']),
    ],
  },
];

function floorMap(from: number, to: number, plate: string, top: number, topPlate: string) {
  const m: Record<number, string> = {};
  for (let f = from; f <= to; f += 1) m[f] = plate;
  m[top] = topPlate;
  return m;
}

const buildings: Building[] = [
  {
    id: 'b3',
    code: '3',
    name: { ru: 'Блок 3', ro: 'Blocul 3' },
    floorsCount: 10,
    firstResidentialFloor: 2,
    floorPlates: floorMap(2, 9, 'b3-typical', 10, 'b3-top'),
    footprint: { x: 8, y: 10, w: 40, h: PLATE_DEPTH },
    storeyHeight: 3.1,
    model3D: null,
  },
  {
    id: 'b4',
    code: '4',
    name: { ru: 'Блок 4', ro: 'Blocul 4' },
    floorsCount: 9,
    firstResidentialFloor: 2,
    floorPlates: floorMap(2, 8, 'b4-typical', 9, 'b4-top'),
    footprint: { x: 46, y: 46, w: 34, h: PLATE_DEPTH },
    storeyHeight: 3.1,
    model3D: null,
  },
];

/** Deterministic pseudo-random in [0, 1). */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function statusFor(floor: number, seed: number, type: FloorSlot['type'], penthouseIndex: number): Apartment['status'] {
  const r = seeded(seed);
  // One penthouse per block on sale, one already reserved.
  if (type === 'penthouse') return penthouseIndex % 2 === 0 ? 'available' : 'reserved';
  // Lower floors sell first in a block under construction.
  const sold = Math.max(0.12, 0.62 - floor * 0.05);
  if (r < sold) return 'sold';
  if (r < sold + 0.14) return 'reserved';
  return 'available';
}

function generate(): Apartment[] {
  const out: Apartment[] = [];
  for (const b of buildings) {
    let number = 0;
    let penthouses = 0;
    const floors = Object.keys(b.floorPlates).map(Number).sort((a, c) => a - c);
    for (const floor of floors) {
      const plate = plates.find((p) => p.id === b.floorPlates[floor])!;
      for (const s of plate.slots) {
        number += 1;
        const { plan, area, outdoorArea, bathrooms } = generatePlan({
          width: s.rect.w,
          depth: s.rect.h,
          rooms: s.rooms,
          type: s.type,
          outdoor: s.outdoor,
        });
        const price = estimate({
          projectSlug: PROJECT,
          buildingId: b.id,
          floor,
          rooms: s.rooms,
          type: s.type,
          area,
          outdoor: s.outdoor,
          outdoorArea,
          parking: 'none',
        });
        const features = new Set<FeatureKey>(s.features);
        if (bathrooms >= 2) features.add('two-bathrooms');
        if (s.outdoor === 'terrace') features.add('terrace');
        if (plan.rooms.some((r) => r.type === 'storage')) features.add('storage');
        if (plan.rooms.some((r) => r.type === 'kitchen-living')) features.add('kitchen-living');
        if (floor >= 7) features.add('high-floor');

        out.push({
          id: `${b.id}-${number}`,
          number: String(number),
          projectSlug: PROJECT,
          buildingId: b.id,
          floor,
          slot: s.id,
          rooms: s.rooms,
          type: s.type,
          area,
          balconyArea: outdoorArea,
          outdoor: s.outdoor,
          bathrooms,
          pricePerSqm: price.pricePerSqm,
          totalPrice: price.apartmentPrice,
          status: statusFor(floor, floor * 100 + number * 7 + (b.id === 'b4' ? 13 : 0), s.type, s.type === 'penthouse' ? penthouses++ : 0),
          plan2D: plan,
          model3D: null,
          features: [...features],
        });
      }
    }
  }
  return out;
}

export const botanicStar2Blocks34: ProjectInventory = {
  projectSlug: PROJECT,
  demo: true,
  currency: 'EUR',
  updatedAt: '2026-09-30',
  site: {
    size: [90, 72],
    north: 0,
    street: { ru: 'ул. Гика Водэ', ro: 'str. Ghica Vodă' },
    features: [
      { type: 'courtyard', rect: { x: 12, y: 29, w: 64, h: 13 } },
      { type: 'playground', rect: { x: 18, y: 31.5, w: 14, h: 8 } },
      { type: 'green', rect: { x: 52, y: 30.5, w: 20, h: 10 } },
      { type: 'green', rect: { x: 8, y: 48, w: 30, h: 12 } },
      { type: 'parking', rect: { x: 50, y: 12, w: 32, h: 12 } },
      { type: 'road', rect: { x: 0, y: 66, w: 90, h: 6 } },
      { type: 'entrance', rect: { x: 40, y: 62, w: 6, h: 4 } },
    ],
  },
  buildings,
  plates,
  apartments: generate(),
  model3D: null,
};
