/**
 * Where an apartment's plan faces — derived from the floor plate, so the data
 * stays single-sourced. Server-side (the page) only: it reads the repository.
 *
 * The plan is always drawn façade-up (plan-generator.ts). A north-façade unit
 * therefore has north at the top of its plan (plus the site's own rotation);
 * a south-façade unit is the plate turned 180°, so north points down and the
 * plate's ends swap sides — which decides where a corner unit's end windows go.
 */
import type { Apartment, ProjectInventory } from '@/lib/inventory/types';
import { getBuilding, getPlate } from '@/lib/inventory/repository';
import type { CornerSide } from './geometry';

export interface PlanOrientation {
  /** Direction of north on the drawing, degrees clockwise from up. */
  northDeg: number;
  facade: 'north' | 'south';
  /** End wall with windows (corner units), in plan left/right. */
  cornerSide: CornerSide;
  /** What the façade windows look onto, when the data says so. */
  outlook: 'courtyard' | 'street' | null;
}

export function planOrientation(inv: ProjectInventory, apt: Apartment): PlanOrientation {
  const building = getBuilding(inv, apt.buildingId);
  const plateId = building?.floorPlates[apt.floor];
  const plate = plateId ? getPlate(inv, plateId) : undefined;
  const slot = plate?.slots.find((s) => s.id === apt.slot);
  const facade = slot?.facade ?? 'north';

  let cornerSide: CornerSide = null;
  if (slot && plate) {
    const atStart = slot.rect.x <= 0.01;
    const atEnd = slot.rect.x + slot.rect.w >= plate.size[0] - 0.01;
    // Turned 180° for a south façade: the plate's start end lands on the right.
    const left = facade === 'north' ? atStart : atEnd;
    const right = facade === 'north' ? atEnd : atStart;
    cornerSide = left && right ? 'both' : left ? 'left' : right ? 'right' : null;
  }

  const outlook = apt.features.includes('courtyard-view')
    ? 'courtyard'
    : apt.features.includes('street-view')
      ? 'street'
      : null;

  return {
    northDeg: (((inv.site.north + (facade === 'south' ? 180 : 0)) % 360) + 360) % 360,
    facade,
    cornerSide,
    outlook,
  };
}
