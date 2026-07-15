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

export interface Floorplan {
  id: string;
  rooms: number;
  /** Living area in m². Optional until confirmed by the owner. */
  area?: number;
  floor?: Localized;
  image?: string;
  available: boolean;
  /** true when the drawing itself is a demo placeholder. */
  placeholder?: boolean;
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
  /** Cover/hero image path in /public. Undefined → branded placeholder. */
  cover?: string;
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
