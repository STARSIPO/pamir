/**
 * Apartment inventory — domain model.
 *
 * Project → Building → Floor → Apartment. Apartments are stored FLAT (one list
 * per project, each row pointing at its building and floor), which is the shape
 * a CRM export, a CMS collection or a SQL table naturally has. Floors and
 * per-building statistics are derived, never stored twice.
 *
 * Geometry lives next to the data, in plan coordinates (metres), so every view
 * — the 2D schemes today, a Three.js / React Three Fiber scene later — reads
 * the same numbers. See docs/INVENTORY.md for the 3D extension points.
 */
import type { Localized } from '@/content/types';

export type ApartmentStatus = 'available' | 'reserved' | 'sold';

export type ApartmentType = 'standard' | 'corner' | 'penthouse';

/** Outdoor space attached to an apartment. */
export type OutdoorType = 'none' | 'balcony' | 'terrace';

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'kitchen-living'
  | 'bedroom'
  | 'bathroom'
  | 'wc'
  | 'hall'
  | 'storage'
  | 'balcony'
  | 'terrace';

/** Feature keys; labels live in the dictionary (inventory.common.features). */
export type FeatureKey =
  | 'corner'
  | 'courtyard-view'
  | 'street-view'
  | 'two-bathrooms'
  | 'terrace'
  | 'storage'
  | 'high-floor'
  | 'kitchen-living';

/** [x, y] in metres. Polygons are closed implicitly (last → first). */
export type Vec2 = [number, number];
export type Polygon = Vec2[];

/** A room inside an apartment plan. */
export interface Room {
  id: string;
  type: RoomType;
  polygon: Polygon;
  /** m², derived from the polygon when the data is generated. */
  area: number;
}

/**
 * 2D plan of one apartment, in the apartment's own coordinate system:
 * origin at the entrance-side corner, x along the corridor, y towards the
 * façade. `rooms` excludes nothing — balconies/terraces are rooms with their
 * own type so they render and label like the rest.
 */
export interface ApartmentPlan2D {
  /** Bounding size in metres (width, depth incl. outdoor space). */
  size: Vec2;
  /** Outer contour of the heated area (walls are drawn on it). */
  outline: Polygon;
  rooms: Room[];
  /** Entrance door position on the outline, for the plan's door mark. */
  entrance: Vec2;
}

/**
 * Reference to a future 3D asset. Null today everywhere; the 3D viewer is
 * mounted only when this is present. `nodeId` lets a single building model
 * address its floors/apartments (e.g. a GLTF node name) so selection in 3D
 * maps onto the same ids as the 2D plans.
 */
export interface Model3DRef {
  src: string;
  format: 'glb' | 'gltf';
  nodeId?: string;
  /** Optional camera preset name defined by the scene. */
  camera?: string;
}

export interface Apartment {
  /** Globally unique and URL-safe: `${buildingId}-${number}`. */
  id: string;
  /** Sales number as printed on the plans (unique within a building). */
  number: string;
  projectSlug: string;
  buildingId: string;
  floor: number;
  /** Slot on the floor plate (see FloorPlate.slots). */
  slot: string;
  rooms: number;
  type: ApartmentType;
  /** Total heated area, m² (sum of indoor rooms). */
  area: number;
  /** Balcony or terrace area, m² (0 when none). */
  balconyArea: number;
  outdoor: OutdoorType;
  bathrooms: number;
  /** EUR per m² of `area`. */
  pricePerSqm: number;
  /** EUR, what the buyer pays (outdoor space priced in). */
  totalPrice: number;
  status: ApartmentStatus;
  plan2D: ApartmentPlan2D;
  model3D: Model3DRef | null;
  features: FeatureKey[];
}

/** One unit slot on a floor plate, in floor-plate coordinates (metres). */
export interface FloorSlot {
  id: string;
  /** Rectangle of the apartment's heated area on the plate. */
  rect: { x: number; y: number; w: number; h: number };
  /** Which side of the rect faces the façade (where the balcony goes). */
  facade: 'north' | 'south';
  rooms: number;
  type: ApartmentType;
  outdoor: OutdoorType;
  features: FeatureKey[];
}

/** A typical floor layout shared by several floors of a building. */
export interface FloorPlate {
  id: string;
  /** Plate size in metres (length along x, depth along y). */
  size: Vec2;
  /** Stairs + lift core. */
  core: { x: number; y: number; w: number; h: number };
  /** Central corridor strip. */
  corridor: { x: number; y: number; w: number; h: number };
  slots: FloorSlot[];
}

export interface Building {
  id: string;
  /** Short code shown on the scheme ("3", "A"…). */
  code: string;
  name: Localized;
  /** Total storeys incl. non-residential ground floor. */
  floorsCount: number;
  /** First floor with apartments for sale. */
  firstResidentialFloor: number;
  /** floor number → plate id. Floors not listed have no apartments. */
  floorPlates: Record<number, string>;
  /** Footprint on the site plan, metres, site coordinates. */
  footprint: { x: number; y: number; w: number; h: number };
  /** Storey height in metres (for elevations / future 3D extrusion). */
  storeyHeight: number;
  model3D: Model3DRef | null;
}

/** Non-building elements drawn on the site scheme. */
export interface SiteFeature {
  type: 'courtyard' | 'playground' | 'parking' | 'green' | 'road' | 'entrance';
  rect: { x: number; y: number; w: number; h: number };
  label?: Localized;
}

export interface ProjectInventory {
  projectSlug: string;
  /** True while the numbers are invented for demonstration. Drives the
   *  notice banner and noindex on every inventory page. */
  demo: boolean;
  currency: 'EUR';
  /** ISO date of the last stock update (shown to buyers). */
  updatedAt: string;
  site: {
    /** Site plan size in metres. */
    size: Vec2;
    /** North direction, degrees clockwise from "up" on the scheme. */
    north: number;
    features: SiteFeature[];
    /** Street name shown along the site edge. */
    street?: Localized;
  };
  buildings: Building[];
  plates: FloorPlate[];
  apartments: Apartment[];
  /** Whole-complex model for the future 3D scene. */
  model3D: Model3DRef | null;
}

/** Aggregates used by the selector steps. */
export interface AvailabilityStats {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  /** Cheapest available total price, EUR (null when nothing is available). */
  priceFrom: number | null;
  /** Available room counts, ascending. */
  rooms: number[];
}
