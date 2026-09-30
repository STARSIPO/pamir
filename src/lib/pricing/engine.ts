/**
 * Pricing engine — the single place where apartment prices are computed.
 *
 * Every number comes from src/config/pricing.json, which the owner edits
 * without touching code: base price per m² per project, coefficients by
 * building / floor / room count / apartment type, the share of the m² price
 * charged for balconies and terraces, parking prices and installment terms.
 *
 * The demo inventory is priced with these same functions, so the calculator
 * and the apartment cards can never disagree. When real prices arrive from a
 * CRM, apartments carry their own `pricePerSqm`/`totalPrice` and this engine
 * stays the calculator's estimate for configurations not in stock.
 */
import raw from '@/config/pricing.json';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';

export type ParkingOption = 'none' | 'surface' | 'underground';

export interface ProjectPricing {
  basePricePerSqm: number;
  buildingCoefficients: Record<string, number>;
  floorCoefficients: { from: number; to: number; k: number }[];
  roomCoefficients: Record<string, number>;
  typeCoefficients: Record<ApartmentType, number>;
  outdoorShare: Record<OutdoorType, number>;
  parking: Record<ParkingOption, number>;
}

export interface InstallmentConfig {
  terms: number[];
  defaultTerm: number;
  minDownPaymentPercent: number;
  maxDownPaymentPercent: number;
  defaultDownPaymentPercent: number;
  /** Annual rate in percent; 0 = interest-free developer installment. */
  annualInterestRate: number;
}

export interface PricingConfig {
  currency: 'EUR';
  /** True while prices are demonstration values (shown to the buyer). */
  demo: boolean;
  /** Totals are rounded to this step (EUR). */
  roundTo: number;
  projects: Record<string, ProjectPricing>;
  installment: InstallmentConfig;
}

export const pricing = raw as PricingConfig;

/** Projects that have a price configuration (the calculator's project list). */
export function pricedProjects(cfg: PricingConfig = pricing): string[] {
  return Object.keys(cfg.projects);
}

function projectConfig(cfg: PricingConfig, projectSlug: string): ProjectPricing {
  const p = cfg.projects[projectSlug];
  if (!p) throw new Error(`No pricing configured for project "${projectSlug}"`);
  return p;
}

function floorK(p: ProjectPricing, floor: number): number {
  return p.floorCoefficients.find((r) => floor >= r.from && floor <= r.to)?.k ?? 1;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export interface PriceInput {
  projectSlug: string;
  buildingId?: string;
  floor: number;
  rooms: number;
  type: ApartmentType;
}

/** EUR per m² for a configuration, rounded to 10. */
export function pricePerSqm(input: PriceInput, cfg: PricingConfig = pricing): number {
  const p = projectConfig(cfg, input.projectSlug);
  const k =
    (input.buildingId ? p.buildingCoefficients[input.buildingId] ?? 1 : 1) *
    floorK(p, input.floor) *
    (p.roomCoefficients[String(Math.min(Math.max(input.rooms, 1), 4))] ?? 1) *
    (p.typeCoefficients[input.type] ?? 1);
  return Math.round((p.basePricePerSqm * k) / 10) * 10;
}

export interface EstimateInput extends PriceInput {
  /** Heated area, m². */
  area: number;
  outdoor: OutdoorType;
  /** Balcony / terrace area, m². */
  outdoorArea: number;
  parking: ParkingOption;
}

export interface Estimate {
  pricePerSqm: number;
  /** area × price per m². */
  areaPrice: number;
  /** Outdoor space at its share of the m² price. */
  outdoorPrice: number;
  /** areaPrice + outdoorPrice, rounded. */
  apartmentPrice: number;
  parkingPrice: number;
  total: number;
}

export function estimate(input: EstimateInput, cfg: PricingConfig = pricing): Estimate {
  const p = projectConfig(cfg, input.projectSlug);
  const ppsm = pricePerSqm(input, cfg);
  const areaPrice = input.area * ppsm;
  const outdoorPrice = input.outdoor === 'none' ? 0 : input.outdoorArea * ppsm * (p.outdoorShare[input.outdoor] ?? 0);
  const apartmentPrice = roundTo(areaPrice + outdoorPrice, cfg.roundTo);
  const parkingPrice = p.parking[input.parking] ?? 0;
  return {
    pricePerSqm: ppsm,
    areaPrice: Math.round(areaPrice),
    outdoorPrice: Math.round(outdoorPrice),
    apartmentPrice,
    parkingPrice,
    total: apartmentPrice + parkingPrice,
  };
}

export interface InstallmentInput {
  price: number;
  downPayment: { mode: 'percent' | 'amount'; value: number };
  termMonths: number;
}

export interface InstallmentResult {
  downPaymentAmount: number;
  downPaymentPercent: number;
  remainder: number;
  monthly: number;
  /** Sum of all payments incl. down payment (differs from price only with interest). */
  totalPaid: number;
}

/**
 * Developer installment. With annualInterestRate = 0 the remainder is split
 * evenly; otherwise a standard annuity is used. The down payment is clamped to
 * the configured min/max share of the price.
 */
export function installment(input: InstallmentInput, cfg: PricingConfig = pricing): InstallmentResult {
  const { minDownPaymentPercent: min, maxDownPaymentPercent: max, annualInterestRate } = cfg.installment;
  const price = Math.max(0, input.price);
  const rawDown =
    input.downPayment.mode === 'percent' ? (price * input.downPayment.value) / 100 : input.downPayment.value;
  const down = Math.min(Math.max(rawDown, (price * min) / 100), (price * max) / 100);
  const remainder = Math.max(0, price - down);
  const n = Math.max(1, Math.round(input.termMonths));
  const r = annualInterestRate / 100 / 12;
  const monthly = r > 0 ? (remainder * r) / (1 - Math.pow(1 + r, -n)) : remainder / n;
  return {
    downPaymentAmount: Math.round(down),
    downPaymentPercent: price ? Math.round((down / price) * 1000) / 10 : 0,
    remainder: Math.round(remainder),
    monthly: Math.round(monthly),
    totalPaid: Math.round(down + monthly * n),
  };
}

/** Locale-aware EUR formatting: "€122 670" (ru/ro both use a thin space group). */
export function formatEUR(value: number, locale: string): string {
  const n = new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', { maximumFractionDigits: 0 }).format(value);
  return `€${n}`;
}

/** "84.6" / "84,6" per locale. */
export function formatArea(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
