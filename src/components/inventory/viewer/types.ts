/**
 * View contracts for the apartment selector.
 *
 * Every step of the flow (complex → building → floor → apartment) is rendered
 * through one of these prop interfaces. The 2D components in this folder
 * implement them today; a Three.js / React Three Fiber scene implements the
 * SAME props later and is swapped in through `ViewerMode` — selection state,
 * URLs, data and the surrounding UI stay untouched.
 *
 * Selection is always by id (building id, floor number, apartment id), and the
 * data model carries `model3D` refs with optional `nodeId`s, so a GLTF scene
 * can map its meshes onto exactly these ids.
 *
 * Two kinds of state per step:
 *   - `active…`   highlighted (hover, keyboard focus) — transient;
 *   - `selected…` / `pinned…` pressed by a tap, click or Enter — persists until
 *     the next choice. Touch has no hover, so this is how a phone (and a 3D
 *     scene driven by taps) shows the info card before navigating.
 *
 * Extras outside the contract. Each view ALSO receives its dictionary slice
 * (accessible names, on-drawing text) and presentation-only props from the
 * step component that mounts it: `labels` (ComplexScheme2D, ApartmentPlan2D),
 * `t` + `common` (Facade2D, FloorPlan2D), `className`, `maxHeight`,
 * `orientation`. A 3D twin is mounted by the same step component and takes
 * the same extras, so its zones get the same aria-labels without new strings.
 * Keep dictionaries out of these interfaces: they are the data/selection
 * contract, and each viewer's text needs differ.
 */
import type { Locale } from '@/i18n/config';
import type {
  Apartment,
  AvailabilityStats,
  Building,
  FloorPlate,
  ProjectInventory,
} from '@/lib/inventory/types';

export type ViewerMode = '2d' | '3d';

/** Step 1 — the whole complex; buildings are selectable. */
export interface ComplexViewProps {
  inventory: ProjectInventory;
  locale: Locale;
  buildingStats: Record<string, AvailabilityStats>;
  activeBuildingId?: string | null;
  /** Building pressed by a tap / click / Enter (its info card is open). */
  selectedBuildingId?: string | null;
  onHoverBuilding?: (buildingId: string | null) => void;
  onSelectBuilding: (buildingId: string) => void;
}

/** Step 2 — one building's elevation; floors are selectable. */
export interface BuildingViewProps {
  inventory: ProjectInventory;
  building: Building;
  locale: Locale;
  floorStats: Record<number, AvailabilityStats>;
  activeFloor?: number | null;
  onHoverFloor?: (floor: number | null) => void;
  onSelectFloor: (floor: number) => void;
}

/** Step 3 — one floor plan; apartments are selectable. */
export interface FloorViewProps {
  inventory: ProjectInventory;
  building: Building;
  plate: FloorPlate;
  floor: number;
  apartments: Apartment[];
  locale: Locale;
  activeApartmentId?: string | null;
  onHoverApartment?: (apartmentId: string | null) => void;
  onSelectApartment: (apartmentId: string) => void;
}

/** Apartment page — the plan itself; rooms are highlightable. */
export interface ApartmentViewProps {
  apartment: Apartment;
  locale: Locale;
  activeRoomId?: string | null;
  onHoverRoom?: (roomId: string | null) => void;
  /** Room pinned by a tap / click / Enter (touch has no hover). */
  pinnedRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
}
