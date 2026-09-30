/**
 * Apartment recommendations — entry point.
 *
 * The UI calls `getRecommendationProvider().recommend(criteria, pool, limit)`
 * with `recommendationPool(projectSlug)` and renders the `Recommendation[]`
 * it gets back. It never imports a concrete provider, so the ranking can move
 * elsewhere without touching a component.
 *
 * Plugging in an AI / ML service later:
 *
 *   1. Add `src/lib/recommend/api.ts` with a class implementing
 *      `RecommendationProvider`:
 *
 *        async recommend(criteria, pool, limit) {
 *          const res = await fetch(process.env.NEXT_PUBLIC_RECOMMEND_API!, {
 *            method: 'POST',
 *            headers: { 'content-type': 'application/json' },
 *            body: JSON.stringify({ criteria, limit, apartmentIds: pool.map((a) => a.id) }),
 *          });
 *          // → [{ id, score, reasons, tradeoffs? }]; map ids back onto `pool`
 *          //   (drop unknown ids, so the model can never invent an apartment).
 *        }
 *
 *      On a static export (GitHub Pages) the endpoint is an external service
 *      (a serverless function holding the model key — never ship the key to
 *      the browser). The model may explain its pick in free text; keep
 *      `reasons` to the MatchReason keys so the chips stay translated.
 *   2. Return it from `getRecommendationProvider()` below — e.g. when
 *      NEXT_PUBLIC_RECOMMEND_PROVIDER === 'api' — and fall back to the local
 *      provider when the request fails or times out, so the block never
 *      goes blank.
 */
import type { Apartment } from '@/lib/inventory/types';
import { allApartments } from '@/lib/inventory/repository';
import { LocalScoringProvider } from './local';
import type { RecommendationBounds, RecommendationProvider } from './types';

export type {
  FloorPreference,
  MatchReason,
  MatchTradeoff,
  Recommendation,
  RecommendationBounds,
  RecommendationCriteria,
  RecommendationProvider,
  ScoreFactor,
} from './types';
export {
  LocalScoringProvider,
  DEFAULT_WEIGHTS,
  LIMITS,
  buildContext,
  layoutKey,
  rankApartments,
  scoreApartment,
} from './local';

let active: RecommendationProvider | null = null;

/** The provider in use (local scoring today). */
export function getRecommendationProvider(): RecommendationProvider {
  active ??= new LocalScoringProvider();
  return active;
}

/** What can be recommended: available apartments, of one project when given. */
export function recommendationPool(projectSlug?: string): Apartment[] {
  return allApartments().filter((a) => a.status === 'available' && (!projectSlug || a.projectSlug === projectSlug));
}

const BUDGET_SNAP = 5000;
const BUDGET_STEP = 1000;

/**
 * Ranges for the form, from the pool: the budget slider spans the cheapest to
 * the dearest flat (snapped to €5 000) and starts at the 60th percentile, so
 * the first press already returns a full list. Null for an empty pool — the
 * block then does not render.
 */
export function recommendationBounds(pool: Apartment[]): RecommendationBounds | null {
  const list = pool.filter((a) => a.status === 'available');
  if (!list.length) return null;
  const prices = list.map((a) => a.totalPrice).sort((a, b) => a - b);
  const priceMin = prices[0];
  const priceMax = prices[prices.length - 1];
  const budgetMin = Math.floor(priceMin / BUDGET_SNAP) * BUDGET_SNAP;
  const budgetMax = Math.max(budgetMin + BUDGET_SNAP, Math.ceil(priceMax / BUDGET_SNAP) * BUDGET_SNAP);
  const p60 = prices[Math.min(prices.length - 1, Math.floor(prices.length * 0.6))];
  const budgetDefault = Math.min(budgetMax, Math.max(budgetMin, Math.round(p60 / BUDGET_SNAP) * BUDGET_SNAP));
  return {
    count: list.length,
    priceMin,
    priceMax,
    budgetMin,
    budgetMax,
    budgetStep: BUDGET_STEP,
    budgetDefault,
    areaMax: Math.ceil(Math.max(...list.map((a) => a.area))),
    rooms: [...new Set(list.map((a) => a.rooms))].sort((a, b) => a - b),
  };
}
