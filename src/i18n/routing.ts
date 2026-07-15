import { type Locale, locales } from './config';

/**
 * Localized URL path segments per route.
 * The RU segment doubles as the *canonical internal folder name* under
 * src/app/[locale]/… . RO uses localized slugs (per the SEO spec) and is
 * rewritten back to the canonical segment by middleware.
 */
export const routeSegments = {
  projects: { ru: 'projects', ro: 'proiecte' },
  company: { ru: 'company', ro: 'despre-companie' },
  services: { ru: 'services', ro: 'servicii' },
  faq: { ru: 'faq', ro: 'intrebari-frecvente' },
  contacts: { ru: 'contacts', ro: 'contacte' },
  privacy: { ru: 'privacy', ro: 'confidentialitate' },
  thankyou: { ru: 'thank-you', ro: 'multumim' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routeSegments;

/** Canonical folder segment (matches the filesystem route). */
export function canonicalSegment(key: RouteKey): string {
  return routeSegments[key].ru;
}

/** Build a localized href, e.g. href('ro', 'projects') → '/ro/proiecte'. */
export function href(locale: Locale, key?: RouteKey, slug?: string): string {
  if (!key) return `/${locale}`;
  const seg = routeSegments[key][locale];
  return slug ? `/${locale}/${seg}/${slug}` : `/${locale}/${seg}`;
}

/** Convenience wrappers used throughout the UI. */
export const routes = {
  home: (l: Locale) => href(l),
  projects: (l: Locale) => href(l, 'projects'),
  project: (l: Locale, slug: string) => href(l, 'projects', slug),
  company: (l: Locale) => href(l, 'company'),
  services: (l: Locale) => href(l, 'services'),
  faq: (l: Locale) => href(l, 'faq'),
  contacts: (l: Locale) => href(l, 'contacts'),
  privacy: (l: Locale) => href(l, 'privacy'),
  thankyou: (l: Locale) => href(l, 'thankyou'),
};

/**
 * hreflang alternates for a given route in every locale.
 * Returns absolute-path map { ru, ro } for <link rel="alternate">.
 */
export function alternates(key?: RouteKey, slug?: string): Record<Locale, string> {
  return locales.reduce(
    (acc, l) => {
      acc[l] = href(l, key, slug);
      return acc;
    },
    {} as Record<Locale, string>,
  );
}

/**
 * Reverse lookup used by middleware: given a RO display segment, return the
 * canonical folder segment (or null if it is already canonical / unknown).
 */
export function canonicalizeRoSegment(displaySeg: string): string | null {
  for (const key of Object.keys(routeSegments) as RouteKey[]) {
    const ro: string = routeSegments[key].ro;
    const ru: string = routeSegments[key].ru;
    if (displaySeg === ro && ro !== ru) return ru;
  }
  return null;
}

/** Reverse: display segment (in a given locale) → route key. */
export function routeKeyFromSegment(locale: Locale, seg: string): RouteKey | undefined {
  return (Object.keys(routeSegments) as RouteKey[]).find(
    (key) => routeSegments[key][locale] === seg,
  );
}

export interface ParsedPath {
  locale: Locale;
  key?: RouteKey;
  slug?: string;
}

/** Parse a browser pathname like "/ro/proiecte/botanic-star" into its parts. */
export function parsePathname(pathname: string): ParsedPath | null {
  const parts = pathname.split('/').filter(Boolean);
  const locale = parts[0];
  if (locale !== 'ru' && locale !== 'ro') return null;
  const key = parts[1] ? routeKeyFromSegment(locale, parts[1]) : undefined;
  const slug = key === 'projects' ? parts[2] : undefined;
  return { locale, key, slug };
}

/**
 * Produce the equivalent path in another locale — used by the language switcher
 * so switching keeps the user on the same page.
 */
export function switchLocalePath(targetLocale: Locale, current: ParsedPath | null): string {
  if (!current) return href(targetLocale);
  return href(targetLocale, current.key, current.slug);
}
