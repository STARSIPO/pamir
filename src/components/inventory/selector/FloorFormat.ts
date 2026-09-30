/**
 * Small text helpers for the floor steps (building → floor → apartment).
 * Pure functions: safe on the server and in client components alike.
 */
import type { Locale } from '@/i18n/config';
import type { Apartment, AvailabilityStats } from '@/lib/inventory/types';
import type { Dictionary } from '@/i18n/dictionaries';
import { formatArea, formatEUR } from '../format';

export type FloorsDict = Dictionary['inventory']['floors'];
export type CommonDict = Dictionary['inventory']['common'];

export interface PluralForms {
  one: string;
  few: string;
  many: string;
  other: string;
}

const rules = new Map<string, Intl.PluralRules>();

/** "4 квартиры", "5 квартир", "21 de apartamente" — CLDR plural categories. */
export function plural(forms: PluralForms, n: number, locale: Locale): string {
  const tag = locale === 'ro' ? 'ro' : 'ru';
  let r = rules.get(tag);
  if (!r) {
    r = new Intl.PluralRules(tag);
    rules.set(tag, r);
  }
  const key = r.select(n) as keyof PluralForms;
  return forms[key] ?? forms.other;
}

export function counted(forms: PluralForms, n: number, locale: Locale): string {
  return `${n} ${plural(forms, n, locale)}`;
}

/** Fill "{name}" placeholders. Unknown keys become empty strings. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : ''));
}

/** Architectural index: 7 → "07". */
export const pad2 = (n: number | string) => String(n).padStart(2, '0');

/** "3 комнаты" (falls back to "5 комн." beyond the dictionary). */
export function roomsLabel(common: CommonDict, rooms: number): string {
  return common.rooms[rooms] ?? `${rooms} ${common.roomsShort}`;
}

/** aria-label for a floor band / list row. */
export function floorAria(t: FloorsDict, floor: number, s: AvailabilityStats, locale: Locale): string {
  return fill(t.floorAria, {
    floor,
    available: s.available,
    total: s.total,
    price: s.priceFrom !== null ? fill(t.priceFromAria, { price: formatEUR(s.priceFrom, locale) }) : '',
  });
}

/** aria-label for an apartment zone / list row. */
export function apartmentAria(t: FloorsDict, common: CommonDict, a: Apartment, locale: Locale): string {
  if (a.status === 'sold') return fill(t.statusOnly, { number: a.number, status: common.status.sold });
  return (
    fill(t.apartmentAria, {
      number: a.number,
      rooms: roomsLabel(common, a.rooms),
      area: formatArea(a.area, locale),
      status: common.status[a.status],
    }) + fill(t.apartmentPriceAria, { price: formatEUR(a.totalPrice, locale) })
  );
}
