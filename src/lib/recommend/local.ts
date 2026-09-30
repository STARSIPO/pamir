/**
 * Local recommendation provider — deterministic weighted scoring.
 *
 * Every apartment in the pool is compared with the buyer's criteria and gets
 * a score in 0…1:
 *
 *   score = CRITERIA_SHARE × (weighted mean of the criteria the buyer set)
 *         + (1 − CRITERIA_SHARE) × (weighted mean of the quality bonuses)
 *
 *   criteria  budget · rooms · min area · floor preference
 *   bonuses   value (price per m² below the median of comparable flats),
 *             outdoor space (terrace, a generous balcony), corner layout
 *
 * A criterion left open ("Любое") drops out of the mean instead of counting as
 * a perfect match, so the percentage always describes what was asked. Hard
 * limits keep the list honest: more than 10% over budget, a room count off by
 * two or more, or a flat a fifth smaller than asked is never suggested.
 *
 * Everything below is a pure function of (apartment, criteria, context), so
 * it is trivially unit-testable and can run in the browser, at build time or
 * on a server. Tuning lives in DEFAULT_WEIGHTS / LIMITS.
 */
import type { Apartment } from '@/lib/inventory/types';
import { getBuilding, getInventory, residentialFloors } from '@/lib/inventory/repository';
import type {
  FloorPreference,
  MatchReason,
  MatchTradeoff,
  Recommendation,
  RecommendationCriteria,
  RecommendationProvider,
  ScoreFactor,
} from './types';

export type ScoringWeights = Record<ScoreFactor, number>;

/**
 * Relative weights. Criteria and bonuses are normalised separately, so only
 * the ratios inside each group matter.
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  budget: 0.35,
  rooms: 0.3,
  area: 0.2,
  floor: 0.15,
  value: 0.5,
  outdoor: 0.25,
  corner: 0.25,
};

const CRITERIA: ScoreFactor[] = ['budget', 'rooms', 'area', 'floor'];
const BONUSES: ScoreFactor[] = ['value', 'outdoor', 'corner'];

/** Share of the score decided by the buyer's criteria; the rest is quality. */
export const CRITERIA_SHARE = 0.88;

export const LIMITS = {
  /** Price above budget still suggested (penalised), as a share of budget. */
  overBudget: 0.1,
  /** Room count difference still suggested (partial match). */
  roomsDelta: 1,
  /** Area deficit still suggested (penalised), as a share of the minimum. */
  areaDeficit: 0.2,
  /** Anything scoring below this is noise, not a recommendation. */
  minScore: 0.5,
  /** At most this many flats of one layout (see `layoutKey`) in a result. */
  perLayout: 2,
  /** Balcony area from which it counts as a reason ("Просторный балкон"), m². */
  generousBalcony: 6,
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* ------------------------------------------------------------------------ */
/* Factor scores. `null` means "excluded": outside the hard limits.         */
/* ------------------------------------------------------------------------ */

/**
 * Within budget scores ~1 (a flat that uses less than three quarters of the
 * budget eases down to 0.8, so equally good matches that fit the buyer's
 * means rank first). Up to 10% over: 0.6 → 0. Beyond: excluded.
 */
export function budgetScore(price: number, budget: number): number | null {
  if (budget <= 0) return 1;
  const r = price / budget;
  if (r <= 1) return 1 - 0.2 * clamp01((0.75 - r) / 0.75);
  if (r > 1 + LIMITS.overBudget) return null;
  return 0.6 * (1 - (r - 1) / LIMITS.overBudget);
}

/** Exact room count 1; one more or one fewer 0.45; further off excluded. */
export function roomsScore(rooms: number, wanted: number): number | null {
  const d = Math.abs(rooms - wanted);
  if (d === 0) return 1;
  if (d > LIMITS.roomsDelta) return null;
  return 0.45;
}

/** At least the minimum 1; a deficit loses 4 points per 1% short; >20% short excluded. */
export function areaScore(area: number, minArea: number): number | null {
  if (minArea <= 0 || area >= minArea) return 1;
  const deficit = (minArea - area) / minArea;
  if (deficit > LIMITS.areaDeficit) return null;
  return clamp01(1 - deficit * 4);
}

/** Position of a floor within the building's residential floors, 0 (lowest) … 1 (highest). */
export function floorPosition(floor: number, range: [number, number]): number {
  const [lo, hi] = range;
  if (hi <= lo) return 0.5;
  return clamp01((floor - lo) / (hi - lo));
}

/**
 * Lower / middle / upper third of the building. Inside the band 1; outside,
 * the score falls with the distance to it (a third of the height away → 0).
 */
export function floorScore(position: number, pref: FloorPreference): number {
  if (pref === 'any') return 1;
  const band: [number, number] = pref === 'low' ? [0, 1 / 3] : pref === 'middle' ? [1 / 3, 2 / 3] : [2 / 3, 1];
  const dist = Math.max(0, band[0] - position, position - band[1]);
  return clamp01(1 - dist * 3);
}

/** Price per m² against the median of comparable flats: at median 0.5, 10% below → 1, 10% above → 0. */
export function valueScore(pricePerSqm: number, medianPricePerSqm: number): number {
  if (medianPricePerSqm <= 0) return 0.5;
  return clamp01(0.5 + ((medianPricePerSqm - pricePerSqm) / medianPricePerSqm) * 5);
}

/** Terrace 1; balcony by its size (8 m² and more → 0.8); none 0. */
export function outdoorScore(a: Pick<Apartment, 'outdoor' | 'balconyArea'>): number {
  if (a.outdoor === 'terrace') return 1;
  if (a.outdoor === 'balcony') return clamp01(a.balconyArea / 8) * 0.8;
  return 0;
}

export function isCorner(a: Pick<Apartment, 'type' | 'features'>): boolean {
  return a.type === 'corner' || a.type === 'penthouse' || a.features.includes('corner');
}

/* ------------------------------------------------------------------------ */
/* Context: everything a score needs to know beyond the apartment itself.   */
/* ------------------------------------------------------------------------ */

export interface ScoringContext {
  /** Lowest and highest residential floor of the apartment's building. */
  floorRange(a: Apartment): [number, number];
  /** Median price per m² of comparable flats (same room count) in the pool. */
  medianPricePerSqm(a: Apartment): number;
}

const buildingKey = (a: Pick<Apartment, 'projectSlug' | 'buildingId'>) => `${a.projectSlug}/${a.buildingId}`;

/** Residential floors of an apartment's building, from the repository. */
export function repositoryFloors(a: Apartment): number[] | undefined {
  const inv = getInventory(a.projectSlug);
  const b = inv && getBuilding(inv, a.buildingId);
  return b ? residentialFloors(b) : undefined;
}

/**
 * Build the scoring context for a pool. `floorsOf` tells a building's
 * residential floors (the repository by default); without it the floors seen
 * in the pool are used. Medians are per room count, so a studio is compared
 * with studios — small flats always cost more per m² — falling back to the
 * whole pool when a group is too small to have a meaningful median.
 */
export function buildContext(
  pool: Apartment[],
  floorsOf: (a: Apartment) => number[] | undefined = repositoryFloors,
): ScoringContext {
  const ranges = new Map<string, [number, number]>();
  const seen = new Map<string, number[]>();
  for (const a of pool) {
    const k = buildingKey(a);
    const list = seen.get(k) ?? [];
    list.push(a.floor);
    seen.set(k, list);
  }
  const rangeFor = (a: Apartment): [number, number] => {
    const k = buildingKey(a);
    const cached = ranges.get(k);
    if (cached) return cached;
    const floors = floorsOf(a) ?? seen.get(k) ?? [a.floor];
    const range: [number, number] = [Math.min(...floors), Math.max(...floors)];
    ranges.set(k, range);
    return range;
  };

  const overall = median(pool.map((a) => a.pricePerSqm));
  const byRooms = new Map<number, number>();
  for (const rooms of new Set(pool.map((a) => a.rooms))) {
    const group = pool.filter((a) => a.rooms === rooms).map((a) => a.pricePerSqm);
    byRooms.set(rooms, group.length >= 3 ? median(group) : overall);
  }

  return {
    floorRange: rangeFor,
    medianPricePerSqm: (a) => byRooms.get(a.rooms) ?? overall,
  };
}

/* ------------------------------------------------------------------------ */
/* Scoring and ranking.                                                     */
/* ------------------------------------------------------------------------ */

function weightedMean(parts: Partial<Record<ScoreFactor, number>>, keys: ScoreFactor[], w: ScoringWeights) {
  let sum = 0;
  let weight = 0;
  for (const k of keys) {
    const v = parts[k];
    if (v === undefined) continue;
    sum += v * w[k];
    weight += w[k];
  }
  return weight > 0 ? sum / weight : null;
}

/**
 * Score one apartment. Returns null when it is outside the hard limits (or
 * not available, or in another project than the criteria ask for).
 */
export function scoreApartment(
  a: Apartment,
  criteria: RecommendationCriteria,
  ctx: ScoringContext,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): Recommendation | null {
  if (a.status !== 'available') return null;
  if (criteria.projectSlug && a.projectSlug !== criteria.projectSlug) return null;

  const parts: Partial<Record<ScoreFactor, number>> = {};
  const reasons: MatchReason[] = [];
  const tradeoffs: MatchTradeoff[] = [];

  if (criteria.budget !== undefined && criteria.budget > 0) {
    const s = budgetScore(a.totalPrice, criteria.budget);
    if (s === null) return null;
    parts.budget = s;
    if (a.totalPrice <= criteria.budget) reasons.push('within-budget');
    else tradeoffs.push('over-budget');
  }

  if (criteria.rooms !== undefined && criteria.rooms > 0) {
    const s = roomsScore(a.rooms, criteria.rooms);
    if (s === null) return null;
    parts.rooms = s;
    if (a.rooms === criteria.rooms) reasons.push('rooms-exact');
    else tradeoffs.push(a.rooms > criteria.rooms ? 'more-rooms' : 'fewer-rooms');
  }

  if (criteria.minArea !== undefined && criteria.minArea > 0) {
    const s = areaScore(a.area, criteria.minArea);
    if (s === null) return null;
    parts.area = s;
    if (a.area >= criteria.minArea) reasons.push('area-ok');
    else tradeoffs.push('smaller-area');
  }

  if (criteria.floor && criteria.floor !== 'any') {
    const s = floorScore(floorPosition(a.floor, ctx.floorRange(a)), criteria.floor);
    parts.floor = s;
    if (s >= 1) reasons.push('floor-match');
    else tradeoffs.push('other-floor');
  }

  parts.value = valueScore(a.pricePerSqm, ctx.medianPricePerSqm(a));
  parts.outdoor = outdoorScore(a);
  parts.corner = isCorner(a) ? 1 : 0;

  if (parts.value >= 0.6) reasons.push('good-value');
  if (a.outdoor === 'terrace' || (a.outdoor === 'balcony' && a.balconyArea >= LIMITS.generousBalcony)) {
    reasons.push('outdoor');
  }
  if (parts.corner === 1) reasons.push('corner');

  const criteriaMean = weightedMean(parts, CRITERIA, weights);
  const bonusMean = weightedMean(parts, BONUSES, weights) ?? 0;
  const score =
    criteriaMean === null ? bonusMean : CRITERIA_SHARE * criteriaMean + (1 - CRITERIA_SHARE) * bonusMean;

  const breakdown: Partial<Record<ScoreFactor, number>> = {};
  for (const k of Object.keys(parts) as ScoreFactor[]) breakdown[k] = round3(parts[k]!);

  return { apartment: a, score: round3(score), reasons, tradeoffs, breakdown };
}

/**
 * Deterministic order: score, then the lower total price, then the lower
 * price per m², then id — equal inputs always give the same list.
 */
export function compareRecommendations(x: Recommendation, y: Recommendation): number {
  if (y.score !== x.score) return y.score - x.score;
  if (x.apartment.totalPrice !== y.apartment.totalPrice) return x.apartment.totalPrice - y.apartment.totalPrice;
  if (x.apartment.pricePerSqm !== y.apartment.pricePerSqm) return x.apartment.pricePerSqm - y.apartment.pricePerSqm;
  return x.apartment.id < y.apartment.id ? -1 : x.apartment.id > y.apartment.id ? 1 : 0;
}

/**
 * What a buyer sees as "the same flat": room count, area to the square metre,
 * type and outdoor space, within one project. The same slot on other floors,
 * mirrored slots and the twin plan in the neighbouring building all share it;
 * the building and slot deliberately do not count.
 */
export function layoutKey(
  a: Pick<Apartment, 'projectSlug' | 'rooms' | 'area' | 'type' | 'outdoor'>,
): string {
  return `${a.projectSlug}/${a.rooms}/${Math.round(a.area)}/${a.type}/${a.outdoor}`;
}

/**
 * Rank a pool and take the best `limit`. One layout (`layoutKey`) is capped at
 * LIMITS.perLayout, so five results are five choices rather than one plan on
 * five floors or in both buildings — unless the pool has nothing else that
 * qualifies, in which case the rest of the list is filled in score order.
 */
export function rankApartments(
  pool: Apartment[],
  criteria: RecommendationCriteria,
  limit: number,
  ctx: ScoringContext = buildContext(pool.filter((a) => a.status === 'available')),
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): Recommendation[] {
  const n = Math.max(0, Math.floor(limit));
  if (!n) return [];

  const scored = pool
    .map((a) => scoreApartment(a, criteria, ctx, weights))
    .filter((r): r is Recommendation => r !== null && r.score >= LIMITS.minScore)
    .sort(compareRecommendations);

  const picked: Recommendation[] = [];
  const skipped: Recommendation[] = [];
  const perLayout = new Map<string, number>();
  for (const r of scored) {
    if (picked.length === n) break;
    const k = layoutKey(r.apartment);
    const used = perLayout.get(k) ?? 0;
    if (used >= LIMITS.perLayout) {
      skipped.push(r);
      continue;
    }
    perLayout.set(k, used + 1);
    picked.push(r);
  }
  for (const r of skipped) {
    if (picked.length === n) break;
    picked.push(r);
  }
  return picked.sort(compareRecommendations);
}

/** The provider the site uses today: runs `rankApartments` in the browser. */
export class LocalScoringProvider implements RecommendationProvider {
  readonly id = 'local-scoring';
  private readonly weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  async recommend(criteria: RecommendationCriteria, pool: Apartment[], limit: number): Promise<Recommendation[]> {
    const available = pool.filter(
      (a) => a.status === 'available' && (!criteria.projectSlug || a.projectSlug === criteria.projectSlug),
    );
    return rankApartments(available, criteria, limit, buildContext(available), this.weights);
  }
}
