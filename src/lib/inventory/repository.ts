/**
 * Inventory repository — the ONLY way views read apartment data.
 *
 * Today it serves bundled modules from src/content/inventory (static export on
 * GitHub Pages has no server). To move to a backend / CMS / CRM, keep these
 * function signatures and change their bodies: fetch at build time for the
 * static site, or turn them async and fetch at request time on a Node host.
 * No component imports src/content/inventory directly.
 */
import type { Apartment, AvailabilityStats, Building, FloorPlate, ProjectInventory } from './types';
import { botanicStar2Blocks34 } from '@/content/inventory/botanic-star-2-blocks-3-4';

const inventories: ProjectInventory[] = [botanicStar2Blocks34];

export function listInventories(): ProjectInventory[] {
  return inventories;
}

/** Slugs of projects that have an apartment selector. */
export function inventorySlugs(): string[] {
  return inventories.map((i) => i.projectSlug);
}

export function getInventory(projectSlug: string): ProjectInventory | undefined {
  return inventories.find((i) => i.projectSlug === projectSlug);
}

export function getBuilding(inv: ProjectInventory, buildingId: string): Building | undefined {
  return inv.buildings.find((b) => b.id === buildingId);
}

export function getPlate(inv: ProjectInventory, plateId: string): FloorPlate | undefined {
  return inv.plates.find((p) => p.id === plateId);
}

/** Residential floors of a building, ascending. */
export function residentialFloors(b: Building): number[] {
  return Object.keys(b.floorPlates)
    .map(Number)
    .sort((a, c) => a - c);
}

export function apartmentsOf(inv: ProjectInventory, filter: { buildingId?: string; floor?: number } = {}): Apartment[] {
  return inv.apartments.filter(
    (a) =>
      (filter.buildingId === undefined || a.buildingId === filter.buildingId) &&
      (filter.floor === undefined || a.floor === filter.floor),
  );
}

export function getApartment(projectSlug: string, apartmentId: string): Apartment | undefined {
  return getInventory(projectSlug)?.apartments.find((a) => a.id === apartmentId);
}

export function stats(list: Apartment[]): AvailabilityStats {
  const available = list.filter((a) => a.status === 'available');
  return {
    total: list.length,
    available: available.length,
    reserved: list.filter((a) => a.status === 'reserved').length,
    sold: list.filter((a) => a.status === 'sold').length,
    priceFrom: available.length ? Math.min(...available.map((a) => a.totalPrice)) : null,
    rooms: [...new Set(available.map((a) => a.rooms))].sort((a, c) => a - c),
  };
}

/** Every apartment across all inventories (recommendation pool, sitemap). */
export function allApartments(): Apartment[] {
  return inventories.flatMap((i) => i.apartments);
}

/** Static params helpers for the App Router (static export). */
export function selectorParams() {
  return inventories.map((i) => ({ slug: i.projectSlug }));
}

export function buildingParams() {
  return inventories.flatMap((i) => i.buildings.map((b) => ({ slug: i.projectSlug, building: b.id })));
}

export function floorParams() {
  return inventories.flatMap((i) =>
    i.buildings.flatMap((b) =>
      residentialFloors(b).map((f) => ({ slug: i.projectSlug, building: b.id, floor: String(f) })),
    ),
  );
}

export function apartmentParams() {
  return inventories.flatMap((i) => i.apartments.map((a) => ({ slug: i.projectSlug, apartment: a.id })));
}
