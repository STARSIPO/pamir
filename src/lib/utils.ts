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

/**
 * Prefix a path to a file in /public with the deployment basePath.
 *
 * `next/image` applies basePath itself — except under `images.unoptimized`,
 * which is exactly the static-export configuration used for GitHub Pages. The
 * export then emits `src="/photos/x.jpg"` while the file is served from
 * `/pamir/photos/x.jpg`, so every image 404s. Script and font URLs are
 * unaffected; only the image src is missed.
 *
 * In Node mode NEXT_PUBLIC_BASE_PATH is empty and this is a no-op.
 */
export function asset(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!base || !path.startsWith('/') || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
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
