/**
 * Calculator → lead form hand-off.
 *
 * When the buyer presses «Оставить заявку» on the calculator, what they
 * calculated travels with the request, so the manager (and later the CRM)
 * receives the configuration and the figures, not a bare consultation
 * request. The calculator publishes one readable line plus the key numbers:
 *
 *   «Расчёт: Блок 3 · 2 комн. · 63,7 м² · этаж 7 · подземный паркинг — итого €101 200;
 *    рассрочка: взнос 30% (€30 360) · 36 мес. · ≈ €1 971 / мес»
 *
 * Consumers, in order of preference:
 *
 *  1. `useLeadCalculation()` — for LeadForm: returns the current calculation
 *     (or null) and registers the form as its consumer. The form shows the
 *     line like the apartment context and posts it with the request.
 *  2. The `pamir:lead-calculation` window event (detail: LeadCalculation |
 *     null). A listener that handles it calls `event.preventDefault()`.
 *  3. Fallback while nothing consumes it: the line is written into the
 *     comment field (`textarea[name="comment"]`) of the lead section, where
 *     the buyer sees it and can edit it, and the existing form posts it as
 *     `comment`. A previous line written this way is replaced, never
 *     duplicated; the buyer's own text is kept.
 *
 * Client side only (it touches window / document when publishing); reading
 * it on the server returns null.
 */
import { useEffect, useSyncExternalStore } from 'react';

export const LEAD_CALCULATION_EVENT = 'pamir:lead-calculation';

export interface LeadCalculation {
  /** One readable line for the manager ("Расчёт: … — итого €101 200"). */
  summary: string;
  /** The calculator mode the buyer left from. */
  mode: 'price' | 'installment';
  projectSlug: string;
  buildingId?: string;
  /** The apartment the calculation started from, if any. */
  apartmentId?: string;
  /** Estimate total, EUR (parking included). */
  total: number;
  /** Installment figures when the buyer left from the installment mode. */
  installment?: { price: number; downPayment: number; downPaymentPercent: number; termMonths: number; monthly: number };
}

let current: LeadCalculation | null = null;
/** Mounted consumers of `useLeadCalculation` (the fallback stays off while > 0). */
let consumers = 0;
/** The line the fallback last wrote into the comment field. */
let written: string | null = null;
const listeners = new Set<() => void>();

export function getLeadCalculation(): LeadCalculation | null {
  return current;
}

export function subscribeLeadCalculation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hand the calculation to the lead form (`formId` — the lead section's id,
 * "lead" on every project and apartment page). Null withdraws it.
 */
export function publishLeadCalculation(next: LeadCalculation | null, formId = 'lead'): void {
  current = next;
  listeners.forEach((l) => l());
  if (typeof window === 'undefined') return;
  const claimed = !window.dispatchEvent(
    new CustomEvent<LeadCalculation | null>(LEAD_CALCULATION_EVENT, { detail: next, cancelable: true }),
  );
  if (claimed || consumers > 0) return;
  writeCommentFallback(formId, next?.summary ?? null);
}

/** Forget the calculation (the calculator left the page). Leaves the form as it is. */
export function clearLeadCalculation(): void {
  current = null;
  written = null;
  listeners.forEach((l) => l());
}

/** LeadForm: the calculation to show and send with the request. */
export function useLeadCalculation(): LeadCalculation | null {
  useEffect(() => {
    consumers += 1;
    return () => {
      consumers -= 1;
    };
  }, []);
  return useSyncExternalStore(subscribeLeadCalculation, getLeadCalculation, () => null);
}

function writeCommentFallback(formId: string, line: string | null) {
  const field = document.getElementById(formId)?.querySelector<HTMLTextAreaElement>('textarea[name="comment"]');
  if (!field) return;
  const value = field.value;
  let next: string;
  if (written && value.includes(written)) {
    // Replace the line written before; keep whatever the buyer added.
    next = value.replace(written, line ?? '').replace(/^\s*\n/, '');
  } else if (!line) {
    return;
  } else if (!value.trim()) {
    next = line;
  } else {
    next = `${line}\n${value}`;
  }
  written = line;
  if (next === value) return;
  // The native setter + an input event, so a controlled field would follow too.
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setValue) setValue.call(field, next);
  else field.value = next;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}
