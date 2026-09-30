/**
 * Apartments related to the one on the page — pure functions over the list
 * the repository returns, so they work the same on any data source.
 */
import type { Apartment } from '@/lib/inventory/types';

/** Numeric sales-number order ("9" before "10"). */
const byNumber = (a: Apartment, b: Apartment) =>
  a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });

/** The other apartments of the same floor, in number order, and where this one sits among them. */
export function floorNeighbours(apartment: Apartment, floorList: Apartment[]) {
  const list = [...floorList].sort(byNumber);
  const index = Math.max(0, list.findIndex((a) => a.id === apartment.id));
  return {
    index,
    total: list.length,
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}

/**
 * Available alternatives to a reserved or sold apartment: same project,
 * ranked by closeness — the building first, then room count, area and floor.
 * A plain distance, not a recommendation engine (that is src/lib/recommend).
 */
export function similarAvailable(apartment: Apartment, pool: Apartment[], limit = 3): Apartment[] {
  return pool
    .filter((a) => a.id !== apartment.id && a.status === 'available' && a.projectSlug === apartment.projectSlug)
    .map((a) => ({
      a,
      d:
        (a.buildingId === apartment.buildingId ? 0 : 3) +
        Math.abs(a.rooms - apartment.rooms) * 4 +
        Math.abs(a.area - apartment.area) / 10 +
        Math.abs(a.floor - apartment.floor) * 0.5,
    }))
    .sort((x, y) => x.d - y.d || byNumber(x.a, y.a))
    .slice(0, limit)
    .map((x) => x.a);
}
