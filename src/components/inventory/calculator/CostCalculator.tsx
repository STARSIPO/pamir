'use client';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';
import type { ParkingOption } from '@/lib/pricing/engine';

export interface CalculatorPreset {
  projectSlug?: string;
  buildingId?: string;
  rooms?: number;
  area?: number;
  floor?: number;
  type?: ApartmentType;
  outdoor?: OutdoorType;
  outdoorArea?: number;
  parking?: ParkingOption;
  /** Apartment id when opened from an apartment page (shown as context). */
  apartmentId?: string;
}

/** Stub — implemented in the build step (calculator zone). */
export function CostCalculator(_props: {
  locale: Locale;
  dict: Dictionary;
  preset?: CalculatorPreset;
  defaultMode?: 'price' | 'installment';
  id?: string;
}) {
  return null;
}
