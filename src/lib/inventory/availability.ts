/**
 * Per-project availability for catalogue rows ("Доступно 65 · от €64 700").
 * Server-only by convention: callers are server components, so the inventory
 * never ships in a client bundle.
 */
import { listInventories, stats } from './repository';

export interface ProjectAvailability {
  available: number;
  priceFrom: number | null;
}

export function catalogueAvailability(): Record<string, ProjectAvailability> {
  return Object.fromEntries(
    listInventories().map((inv) => {
      const s = stats(inv.apartments);
      return [inv.projectSlug, { available: s.available, priceFrom: s.priceFrom }];
    }),
  );
}
