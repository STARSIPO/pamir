/**
 * Apartment recommendations — provider contract.
 *
 * Today a local scoring provider ranks the inventory in the browser. To use an
 * AI / ML service later, implement `RecommendationProvider` with a fetch to the
 * API and register it in src/lib/recommend/index.ts — the UI only talks to the
 * interface and renders `Recommendation[]`.
 */
import type { Apartment } from '@/lib/inventory/types';

export type FloorPreference = 'any' | 'low' | 'middle' | 'high';

export interface RecommendationCriteria {
  projectSlug?: string;
  /** Maximum total price, EUR. */
  budget?: number;
  rooms?: number;
  /** Minimum heated area, m². */
  minArea?: number;
  floor?: FloorPreference;
}

/** Why an apartment matched — rendered as short localized chips. */
export type MatchReason =
  | 'within-budget'
  | 'rooms-exact'
  | 'area-ok'
  | 'floor-match'
  | 'good-value'
  | 'outdoor'
  | 'corner';

export interface Recommendation {
  apartment: Apartment;
  /** 0…1; shown as "Лучшее совпадение — 96%". */
  score: number;
  reasons: MatchReason[];
}

export interface RecommendationProvider {
  id: string;
  recommend(criteria: RecommendationCriteria, pool: Apartment[], limit: number): Promise<Recommendation[]>;
}
