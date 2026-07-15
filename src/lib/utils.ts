import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a raw phone string into a tel: href (strip spaces, keep leading +). */
export function telHref(phone: string) {
  return 'tel:' + phone.replace(/[^\d+]/g, '');
}

/** WhatsApp / Viber deep link from an international number. */
export function whatsappHref(phone: string, text?: string) {
  const num = phone.replace(/[^\d]/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${num}${q}`;
}

/** Current year, evaluated at render time (never hard-code copyright years). */
export function currentYear() {
  return new Date().getFullYear();
}
