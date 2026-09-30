/**
 * Cost calculator — the per-project setup, derived from the inventory.
 *
 * SERVER SIDE ONLY (in practice: import it from server components such as
 * CostCalculator, never from a 'use client' module). It reads the inventory
 * repository, which brings the project content and the plan generator with
 * it; the browser only ever receives the small `CalculatorProjectSetup`
 * objects this builds. The pure helpers the interactive calculator needs
 * (ranges, reconcile, installment bounds) live in ./calculator, which has no
 * repository import and is safe in the client bundle.
 */
import { getInventory, residentialFloors } from '@/lib/inventory/repository';
import { pricing, type PricingConfig } from './engine';
import {
  calculatorLimits,
  type CalculatorBuilding,
  type CalculatorProjectSetup,
  type LimitRange,
} from './calculator';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';
import type { ParkingOption } from './engine';

const round1 = (n: number) => Math.round(n * 10) / 10;
const median = (list: number[]) => {
  const s = [...list].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Widen a range so it contains every value of `list`; default → the list's median. */
function spanWith(range: LimitRange, list: number[]): LimitRange {
  if (!list.length) return range;
  return {
    min: Math.min(range.min, Math.floor(Math.min(...list))),
    max: Math.max(range.max, Math.ceil(Math.max(...list))),
    default: round1(median(list)),
  };
}

/**
 * What the calculator offers for one priced project: room counts, types,
 * outdoor and parking options from pricing.json; buildings, floors and area
 * ranges from the project's inventory when it has one (so every apartment in
 * stock can be reproduced exactly), the configured limits otherwise.
 */
export function calculatorSetup(slug: string, cfg: PricingConfig = pricing): CalculatorProjectSetup {
  const p = cfg.projects[slug];
  if (!p) throw new Error(`No pricing configured for project "${slug}"`);
  const limits = calculatorLimits(cfg);
  const inv = getInventory(slug);
  const stock = inv?.apartments ?? [];

  const rooms = Object.keys(p.roomCoefficients)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const area: Record<number, LimitRange> = {};
  for (const n of rooms) {
    const base = limits.area[String(n)] ?? limits.area['2'];
    area[n] = spanWith(base, stock.filter((a) => a.rooms === n).map((a) => a.area));
  }

  const outdoorArea = {
    balcony: spanWith(
      limits.outdoorArea.balcony,
      stock.filter((a) => a.outdoor === 'balcony').map((a) => a.balconyArea),
    ),
    terrace: spanWith(
      limits.outdoorArea.terrace,
      stock.filter((a) => a.outdoor === 'terrace').map((a) => a.balconyArea),
    ),
  };

  const buildings: CalculatorBuilding[] = (inv?.buildings ?? [])
    .map((b) => {
      const floors = residentialFloors(b);
      return floors.length
        ? { id: b.id, name: b.name, floors: { min: floors[0], max: floors[floors.length - 1] } }
        : null;
    })
    .filter((b): b is CalculatorBuilding => b !== null);

  let floors = limits.floors;
  if (buildings.length) {
    const min = Math.min(...buildings.map((b) => b.floors.min));
    const max = Math.max(...buildings.map((b) => b.floors.max));
    floors = { min, max, default: Math.round((min + max) / 2) };
  }

  return {
    slug,
    rooms,
    types: Object.keys(p.typeCoefficients) as ApartmentType[],
    outdoor: Object.keys(p.outdoorShare) as OutdoorType[],
    outdoorShare: p.outdoorShare,
    parking: (Object.keys(p.parking) as ParkingOption[]).map((option) => ({ option, price: p.parking[option] })),
    buildings,
    floors,
    area,
    outdoorArea,
  };
}
