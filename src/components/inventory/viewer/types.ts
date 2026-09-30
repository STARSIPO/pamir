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
}
