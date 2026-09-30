import type { Locale } from '@/i18n/config';

/** A string available in every supported language. Add 'en' here to extend. */
export type Localized = Record<Locale, string>;

export type ProjectStatus = 'construction' | 'completed';

export interface KeyValue {
  key: string;
  label: Localized;
  value: Localized;
}

export interface Advantage {
  /** lucide-react icon name or custom key handled by <FeatureIcon>. */
  icon: string;
  label: Localized;
  note?: Localized;
}

/**
 * Sales status of a unit or unit type.
 *
 * `unknown` is the honest default: the owner has not confirmed availability,
 * and inventing "available" would misrepresent stock to a buyer.
 */
export type AvailabilityStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export interface Floorplan {
  id: string;
  rooms: number;
  /** Living area in m². Optional until confirmed by the owner. */
  area?: number;
  floor?: Localized;
  image?: string;
  /**
   * @deprecated Use `status`. Kept so existing content literals stay valid;
   * `status` wins when both are set. See resolveAvailability().
   */
  available: boolean;
  /** Richer replacement for `available`. Falls back to it when absent. */
  status?: AvailabilityStatus;
  /** true when the drawing itself is a demo placeholder. */
  placeholder?: boolean;
}

/** Single source of truth for reading a floorplan's status. */
export function resolveAvailability(f: Pick<Floorplan, 'available' | 'status'>): AvailabilityStatus {
  return f.status ?? (f.available ? 'available' : 'unknown');
}

export interface NearbyPlace {
  icon: string;
  label: Localized;
  /** Distance/time is intentionally optional — never invent it. */
  distance?: Localized;
}

export interface Project {
  slug: string;
  name: Localized;
  /** Short kicker under the name on the detail hero. */
  tagline: Localized;
  status: ProjectStatus;
  district: Localized;
  address?: Localized;
  /** Cover image path in /public. Undefined → branded placeholder. */
  cover?: string;
  /** Wide image for full-bleed slots (hero, feature band). Falls back to cover. */
  hero?: string;
  /**
   * What the cover is. Renders are captioned "Визуализация / Vizualizare" so a
   * buyer never mistakes a visualisation of an unbuilt block for a photo.
   */
  coverKind?: 'render' | 'photo';
  /**
   * CSS object-position for the cover when a card crops it (4/5, 1/1…), e.g.
   * '57% 50%'. Set it when the building is off-centre in a wide render, so a
   * portrait crop keeps the whole tower instead of cutting its edge.
   */
  coverPosition?: string;
  gallery: string[];
  excerpt: Localized;
  description: Localized[];
  specs: KeyValue[];
  advantages: Advantage[];
  floorplans: Floorplan[];
  nearby: NearbyPlace[];
  /** Map embed / coordinates; optional until confirmed. */
  mapQuery?: string;
  featured?: boolean;
  /** Human-readable notes about data that still needs owner confirmation. */
  unconfirmed?: string[];
}

export interface Service {
  slug: string;
  icon: string;
  title: Localized;
  summary: Localized;
  points: Localized[];
  image?: string;
}

export interface FaqItem {
  q: Localized;
  a: Localized;
}

export interface Stat {
  /** Numeric target for the count-up animation. */
  value: number;
  suffix?: string;
  label: Localized;
  /** true when the number is a demo placeholder awaiting real data. */
  placeholder?: boolean;
}
