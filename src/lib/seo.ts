import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { alternates, type RouteKey } from '@/i18n/routing';

/** Build per-page metadata with canonical + hreflang alternates. */
export function buildMetadata({
  locale,
  routeKey,
  slug,
  title,
  description,
}: {
  locale: Locale;
  routeKey?: RouteKey;
  slug?: string;
  title: string;
  description?: string;
}): Metadata {
  const alt = alternates(routeKey, slug);
  const canonical = alt[locale];
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { 'ru-MD': alt.ru, 'ro-MD': alt.ro, 'x-default': alt.ru },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  };
}
