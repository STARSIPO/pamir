/**
 * Fill `{name}` placeholders of a dictionary template:
 *   fill('Квартира №{n}', { n: 34 }) → 'Квартира №34'.
 * Unknown placeholders are left as they are, so a missing value shows up in
 * review instead of silently printing "undefined". A number and its unit
 * ("84,6 м²", "2 m") are tied with a no-break space, so a line never starts
 * with the unit.
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template
    .replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m))
    .replace(/(\d) (?=[мm]²?(?![\p{L}\p{N}]))/gu, '$1 ');
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
