import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's stock scales. The brand display sizes
 * (`text-display-lg` et al, declared in tailwind.config.ts) look like colour
 * utilities to it, so in `cn('text-display-lg', 'text-ink')` it treated them as
 * the same conflict group and dropped the size — headings silently rendered at
 * 16px instead of the clamp() display scale.
 *
 * Registering them in the font-size group fixes size + colour composition
 * everywhere, including SectionHeading and PageHero which pick their tone
 * colour conditionally after the size class.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-2xl', 'display-xl', 'display-lg', 'display-md'] }],
    },
  },
});

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
