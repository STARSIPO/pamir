/**
 * Cost calculator — what the buyer can dial in, and the state that feeds the
 * pricing engine.
 *
 * Prices never live here: every euro comes from src/config/pricing.json
 * through engine.ts (`estimate`, `installment`). This module only decides the
 * input ranges (area per room count, floors, balcony / terrace area) and the
 * defaults. The per-project setup is derived from the inventory in
 * ./calculator-setup (server side), so the sliders span what is actually
 * built and any apartment of the stock can be reproduced exactly.
 *
 * Pure and dependency-light on purpose: the interactive calculator imports it
 * in the browser, so it must never import the inventory repository (that
 * would ship the project content and the plan generator to every page).
 *
 * The ranges are UI limits, not prices. They can be overridden without code
 * by adding an optional `"calculator"` block to pricing.json with the shape
 * of `CalculatorLimits` (any subset); the defaults below apply otherwise.
 */
import type { Localized } from '@/content/types';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';
import {
  installment,
  pricing,
  type EstimateInput,
  type InstallmentResult,
  type ParkingOption,
  type PricingConfig,
} from './engine';

export interface LimitRange {
  min: number;
  max: number;
  /** Starting value when nothing is preset. */
  default: number;
}

export interface CalculatorLimits {
  /** Heated area, m², by room count ("1"…"4"). */
  area: Record<string, LimitRange>;
  /** Balcony / terrace area, m². */
  outdoorArea: Record<'balcony' | 'terrace', LimitRange>;
  /** Used when the project has no inventory (no known building heights). */
  floors: LimitRange;
  /** Slider step for areas, m². */
  areaStep: number;
  /** Slider step for a down payment entered in euros. */
  downPaymentStep: number;
  /** Bounds for a price typed into the installment calculator, EUR. */
  installmentPrice: { min: number; max: number };
}

export const DEFAULT_CALCULATOR_LIMITS: CalculatorLimits = {
  area: {
    '1': { min: 25, max: 60, default: 42 },
    '2': { min: 40, max: 90, default: 62 },
    '3': { min: 60, max: 125, default: 84.6 },
    '4': { min: 80, max: 180, default: 110 },
  },
  outdoorArea: {
    balcony: { min: 2, max: 15, default: 4.8 },
    terrace: { min: 8, max: 60, default: 20 },
  },
  floors: { min: 1, max: 12, default: 5 },
  areaStep: 0.1,
  downPaymentStep: 500,
  installmentPrice: { min: 5000, max: 5000000 },
};

type WithCalculator = PricingConfig & { calculator?: Partial<CalculatorLimits> };

/** Limits from pricing.json's optional `calculator` block, over the defaults. */
export function calculatorLimits(cfg: PricingConfig = pricing): CalculatorLimits {
  const o = (cfg as WithCalculator).calculator ?? {};
  const d = DEFAULT_CALCULATOR_LIMITS;
  return {
    area: { ...d.area, ...o.area },
    outdoorArea: { ...d.outdoorArea, ...o.outdoorArea },
    floors: { ...d.floors, ...o.floors },
    areaStep: o.areaStep ?? d.areaStep,
    downPaymentStep: o.downPaymentStep ?? d.downPaymentStep,
    installmentPrice: { ...d.installmentPrice, ...o.installmentPrice },
  };
}

export interface CalculatorBuilding {
  id: string;
  name: Localized;
  floors: { min: number; max: number };
}

/** Everything the calculator UI needs to know about one priced project (built by `calculatorSetup`). */
export interface CalculatorProjectSetup {
  slug: string;
  rooms: number[];
  types: ApartmentType[];
  outdoor: OutdoorType[];
  /** Share of the m² price charged for outdoor space (0.5 = half). */
  outdoorShare: Record<OutdoorType, number>;
  parking: { option: ParkingOption; price: number }[];
  /** Buildings from the inventory; empty when the project has none. */
  buildings: CalculatorBuilding[];
  /** Floor range across the project (per building: `floorRange`). */
  floors: LimitRange;
  area: Record<number, LimitRange>;
  outdoorArea: Record<'balcony' | 'terrace', LimitRange>;
}

/** Floors a buyer can pick: the building's residential floors, else the project's range. */
export function floorRange(setup: CalculatorProjectSetup, buildingId?: string): LimitRange {
  const b = setup.buildings.find((x) => x.id === buildingId);
  if (!b) return setup.floors;
  return { min: b.floors.min, max: b.floors.max, default: Math.round((b.floors.min + b.floors.max) / 2) };
}

/** Calculator inputs — exactly what `estimate()` takes. */
export interface CalculatorState {
  projectSlug: string;
  buildingId?: string;
  rooms: number;
  area: number;
  floor: number;
  type: ApartmentType;
  outdoor: OutdoorType;
  outdoorArea: number;
  parking: ParkingOption;
}

export type CalculatorStateInput = Partial<CalculatorState>;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Area range for a room count, widened so a preset value is always reachable. */
export function areaRange(setup: CalculatorProjectSetup, rooms: number, value?: number): LimitRange {
  const r = setup.area[rooms] ?? setup.area[setup.rooms[0]];
  if (value === undefined) return r;
  return { ...r, min: Math.min(r.min, Math.floor(value)), max: Math.max(r.max, Math.ceil(value)) };
}

export function outdoorAreaRange(setup: CalculatorProjectSetup, outdoor: OutdoorType, value?: number): LimitRange {
  const r = setup.outdoorArea[outdoor === 'terrace' ? 'terrace' : 'balcony'];
  if (value === undefined) return r;
  return { ...r, min: Math.min(r.min, Math.floor(value)), max: Math.max(r.max, Math.ceil(value)) };
}

/**
 * Starting state: the preset where it is valid for the project, sensible
 * defaults elsewhere. Preset numbers are taken as they are (never snapped to
 * a slider step), so an apartment's own figures reproduce its price exactly.
 */
export function initialCalculatorState(
  setup: CalculatorProjectSetup,
  preset: CalculatorStateInput = {},
): CalculatorState {
  const buildingId =
    setup.buildings.find((b) => b.id === preset.buildingId)?.id ?? setup.buildings[0]?.id ?? undefined;
  const floors = floorRange(setup, buildingId);
  const rooms =
    preset.rooms && setup.rooms.includes(preset.rooms) ? preset.rooms : setup.rooms.includes(2) ? 2 : setup.rooms[0];
  const area = preset.area && preset.area > 0 ? preset.area : areaRange(setup, rooms).default;
  const type = preset.type && setup.types.includes(preset.type) ? preset.type : (setup.types[0] ?? 'standard');
  const fallbackOutdoor: OutdoorType = setup.outdoor.includes('balcony') ? 'balcony' : 'none';
  const outdoor = preset.outdoor && setup.outdoor.includes(preset.outdoor) ? preset.outdoor : fallbackOutdoor;
  const outdoorArea =
    outdoor === 'none'
      ? 0
      : preset.outdoorArea && preset.outdoorArea > 0
        ? preset.outdoorArea
        : outdoorAreaRange(setup, outdoor).default;
  const parkingOptions = setup.parking.map((x) => x.option);
  const parking = preset.parking && parkingOptions.includes(preset.parking) ? preset.parking : 'none';
  const floor = preset.floor !== undefined ? clamp(Math.round(preset.floor), floors.min, floors.max) : floors.default;
  return { projectSlug: setup.slug, buildingId, rooms, area, floor, type, outdoor, outdoorArea, parking };
}

/**
 * Carry a state over to another project / building: keep what still applies,
 * clamp the rest into the new ranges.
 */
export function reconcileState(setup: CalculatorProjectSetup, s: CalculatorState): CalculatorState {
  const buildingId = setup.buildings.find((b) => b.id === s.buildingId)?.id ?? setup.buildings[0]?.id;
  const floors = floorRange(setup, buildingId);
  const rooms = setup.rooms.includes(s.rooms) ? s.rooms : setup.rooms[0];
  const areaR = areaRange(setup, rooms);
  const outdoor = setup.outdoor.includes(s.outdoor) ? s.outdoor : 'none';
  const outdoorR = outdoorAreaRange(setup, outdoor);
  return {
    projectSlug: setup.slug,
    buildingId,
    rooms,
    area: clamp(s.area, areaR.min, areaR.max),
    floor: clamp(s.floor, floors.min, floors.max),
    type: setup.types.includes(s.type) ? s.type : (setup.types[0] ?? 'standard'),
    outdoor,
    outdoorArea:
      outdoor === 'none' ? 0 : s.outdoorArea > 0 ? clamp(s.outdoorArea, outdoorR.min, outdoorR.max) : outdoorR.default,
    parking: setup.parking.some((x) => x.option === s.parking) ? s.parking : 'none',
  };
}

/** The engine's input for a calculator state. */
export function toEstimateInput(s: CalculatorState): EstimateInput {
  return {
    projectSlug: s.projectSlug,
    buildingId: s.buildingId,
    floor: s.floor,
    rooms: s.rooms,
    type: s.type,
    area: s.area,
    outdoor: s.outdoor,
    outdoorArea: s.outdoor === 'none' ? 0 : s.outdoorArea,
    parking: s.parking,
  };
}

export function sameState(a: CalculatorState, b: CalculatorState): boolean {
  return (Object.keys(a) as (keyof CalculatorState)[]).every((k) => a[k] === b[k]);
}

/* ------------------------------------------------------------------------
   Installment
   ------------------------------------------------------------------------ */

export type DownPaymentMode = 'percent' | 'amount';

/** Down-payment bounds for a price, from the configured min/max share. */
export function downPaymentBounds(price: number, cfg: PricingConfig = pricing) {
  const { minDownPaymentPercent: minPct, maxDownPaymentPercent: maxPct } = cfg.installment;
  const step = calculatorLimits(cfg).downPaymentStep;
  const safe = Math.max(0, price);
  const minAmount = Math.ceil((safe * minPct) / 100 / step) * step;
  return {
    minPercent: minPct,
    maxPercent: maxPct,
    minAmount,
    maxAmount: Math.max(minAmount, Math.floor((safe * maxPct) / 100 / step) * step),
    amountStep: step,
  };
}

/** Convert a down-payment value between % and € for a price (rounded to the UI step). */
export function convertDownPayment(
  value: number,
  from: DownPaymentMode,
  price: number,
  cfg: PricingConfig = pricing,
): number {
  const b = downPaymentBounds(price, cfg);
  if (from === 'percent') {
    const amount = Math.round((price * value) / 100 / b.amountStep) * b.amountStep;
    return clamp(amount, b.minAmount, b.maxAmount);
  }
  const pct = price > 0 ? Math.round((value / price) * 100) : b.minPercent;
  return clamp(pct, b.minPercent, b.maxPercent);
}

/** Installment with the configured default down payment and term — the "≈ €X / month" teaser. */
export function defaultInstallment(price: number, cfg: PricingConfig = pricing): InstallmentResult {
  return installment(
    {
      price,
      downPayment: { mode: 'percent', value: cfg.installment.defaultDownPaymentPercent },
      termMonths: cfg.installment.defaultTerm,
    },
    cfg,
  );
}
