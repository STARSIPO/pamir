import type { AvailabilityStatus, Localized } from './types';

/**
 * DEMO INVENTORY — INVENTED DATA, NOT THE CLIENT'S STOCK.
 *
 * The repo has no real unit list: PLACEHOLDERS.md records that floor counts and
 * total apartment counts are unconfirmed, and content/projects.ts carries only
 * three placeholder floorplan types per project. Drawing a real building from
 * data we do not have would be inventing facts about apartments for sale.
 *
 * So this file exists to power the /preview/ routes ONLY. Those routes are
 * disallowed in robots.txt, excluded from the sitemap, and carry a visible
 * banner saying the numbers are fabricated. Nothing here may be rendered on a
 * public page. When the client sends the real sheet — block, floor, unit no.,
 * rooms, total m², status, price — replace this module and delete the banner.
 */
export const DEMO_DATA_NOTICE: Localized = {
  ru: 'Демонстрационные данные. Планировки, цены и статусы вымышлены и не отражают реальные остатки.',
  ro: 'Date demonstrative. Planurile, prețurile și statusurile sunt fictive și nu reflectă stocul real.',
};

export interface DemoUnit {
  id: string;
  /** Entrance / scară. Chișinău blocks are sold per staircase. */
  entrance: string;
  floor: number;
  /** Position along the floor, left to right on the elevation. */
  position: number;
  number: number;
  rooms: number;
  /** Total area incl. balcony — the figure Moldovan buyers compare on. */
  areaTotal: number;
  areaLiving: number;
  orientation: Localized;
  status: AvailabilityStatus;
  /** EUR. Absent when the unit is not for sale. */
  price?: number;
}

export interface DemoBlock {
  id: string;
  name: Localized;
  project: Localized;
  district: Localized;
  /** Ground floor holds commercial space, not apartments. */
  commercialGroundFloor: boolean;
  units: DemoUnit[];
}

const ORIENTATIONS: Localized[] = [
  { ru: 'Ю-З', ro: 'S-V' },
  { ru: 'С-В', ro: 'N-E' },
  { ru: 'Ю-В', ro: 'S-E' },
  { ru: 'С-З', ro: 'N-V' },
];

/** Deterministic pseudo-random so the demo façade is stable across builds. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildBlock(): DemoBlock {
  const floors = 9;
  const perFloor = 8;
  const units: DemoUnit[] = [];
  let number = 1;

  for (let floor = 1; floor <= floors; floor += 1) {
    for (let position = 1; position <= perFloor; position += 1) {
      const seed = floor * 100 + position;
      const r = seeded(seed);

      // Ground floor is commercial — never sold as apartments.
      if (floor === 1) {
        units.push({
          id: `b3-f1-p${position}`,
          entrance: position <= 4 ? 'A' : 'B',
          floor,
          position,
          number: 0,
          rooms: 0,
          areaTotal: 0,
          areaLiving: 0,
          orientation: ORIENTATIONS[position % 4],
          status: 'unknown',
        });
        continue;
      }

      // Lower floors sell first, so availability rises with height.
      const soldBias = 1 - (floor - 2) / (floors - 2);
      const status: AvailabilityStatus =
        r < soldBias * 0.72 ? 'sold' : r < soldBias * 0.72 + 0.14 ? 'reserved' : 'available';

      const rooms = position % 4 === 1 ? 1 : position % 4 === 0 ? 3 : 2;
      const areaTotal = rooms === 1 ? 38 + Math.round(r * 6) : rooms === 2 ? 55 + Math.round(r * 8) : 74 + Math.round(r * 10);

      units.push({
        id: `b3-f${floor}-p${position}`,
        entrance: position <= 4 ? 'A' : 'B',
        floor,
        position,
        number: number++,
        rooms,
        areaTotal,
        areaLiving: Math.round(areaTotal * 0.71),
        orientation: ORIENTATIONS[position % 4],
        status,
        price: status === 'sold' ? undefined : Math.round((areaTotal * 1075 + r * 2000) / 100) * 100,
      });
    }
  }

  return {
    id: 'botanic-star-2-block-3',
    name: { ru: 'Блок 3', ro: 'Blocul 3' },
    project: { ru: 'Botanic Star 2', ro: 'Botanic Star 2' },
    district: { ru: 'Ботаника', ro: 'Botanica' },
    commercialGroundFloor: true,
    units,
  };
}

export const demoBlock: DemoBlock = buildBlock();

export function demoCounts(block: DemoBlock) {
  const sellable = block.units.filter((u) => u.rooms > 0);
  return {
    total: sellable.length,
    available: sellable.filter((u) => u.status === 'available').length,
    reserved: sellable.filter((u) => u.status === 'reserved').length,
    sold: sellable.filter((u) => u.status === 'sold').length,
  };
}
