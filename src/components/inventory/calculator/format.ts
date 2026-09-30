import { NBSP } from '@/lib/text';
import { formatArea, formatEUR } from '@/lib/pricing/engine';

/** Fill "{name}" placeholders of a dictionary string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** "84,6 м²" — value and unit never part at a line break. */
export function areaText(value: number, locale: string, unit: string): string {
  return `${formatArea(value, locale)}${NBSP}${unit}`;
}

/** "40 м²" / "84,6 м²" — no forced decimal (slider ends). */
export function areaShort(value: number, locale: string, unit: string): string {
  const n = new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', { maximumFractionDigits: 1 }).format(value);
  return `${n}${NBSP}${unit}`;
}

/** "+ €12 000". */
export function plusEUR(value: number, locale: string): string {
  return `+${NBSP}${formatEUR(value, locale)}`;
}

/** Parse a typed number: "84,6", "84.6", "134 670", "€134 670". Null when empty / invalid. */
export function parseNumber(raw: string, decimals: boolean): number | null {
  const cleaned = decimals
    ? raw.replace(/[^\d.,-]/g, '').replace(',', '.')
    : raw.replace(/[^\d-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "32,4" — a share with at most one decimal, per locale (the % sign is added by the caller). */
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', { maximumFractionDigits: 1 }).format(value);
}

/** Group digits per locale without a currency sign ("134 670" / "134.670"). */
export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', { maximumFractionDigits: 0 }).format(value);
}
