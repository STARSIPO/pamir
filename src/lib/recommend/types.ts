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

/**
 * Where an apartment falls short of the criteria. Shown next to the reasons
 * so a near match is never presented as a perfect one ("На 4% выше бюджета").
 */
export type MatchTradeoff = 'over-budget' | 'more-rooms' | 'fewer-rooms' | 'smaller-area' | 'other-floor';

/** Components of the score, each 0…1 (see src/lib/recommend/local.ts). */
export type ScoreFactor = 'budget' | 'rooms' | 'area' | 'floor' | 'value' | 'outdoor' | 'corner';

export interface Recommendation {
  apartment: Apartment;
  /** 0…1; shown as "Лучшее совпадение — 96%". */
  score: number;
  reasons: MatchReason[];
  /** Compromises, if any. Optional: a provider may not report them. */
  tradeoffs?: MatchTradeoff[];
  /** Per-factor scores behind `score` — for explanations, analytics, tests. */
  breakdown?: Partial<Record<ScoreFactor, number>>;
}

export interface RecommendationProvider {
  id: string;
  recommend(criteria: RecommendationCriteria, pool: Apartment[], limit: number): Promise<Recommendation[]>;
}

/**
 * What the recommendation form offers, derived from the pool so the slider
 * and the chips never promise something that is not in stock.
 */
export interface RecommendationBounds {
  /** Apartments in the pool (available only). */
  count: number;
  /** Cheapest / dearest apartment in the pool, EUR. */
  priceMin: number;
  priceMax: number;
  /** Budget slider range and step, EUR. */
  budgetMin: number;
  budgetMax: number;
  budgetStep: number;
  /** Where the slider starts. */
  budgetDefault: number;
  /** Largest heated area in the pool, m² (upper bound of the min-area field). */
  areaMax: number;
  /** Room counts present in the pool, ascending. */
  rooms: number[];
}
