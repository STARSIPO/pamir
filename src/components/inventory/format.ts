/** Formatting helpers shared by inventory views (thin wrappers over the pricing engine's). */
export { formatEUR, formatArea } from '@/lib/pricing/engine';

/** "Этаж 7" / "Etajul 7". */
export function floorLabel(word: string, floor: number) {
  return `${word} ${floor}`;
}
