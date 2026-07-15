import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { href, alternates, type RouteKey } from '@/i18n/routing';
import { projects } from '@/content/projects';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

const abs = (path: string) => `${SITE_URL}${path}`;

function langMap(key?: RouteKey, slug?: string) {
  const alt = alternates(key, slug);
  return { ru: abs(alt.ru), ro: abs(alt.ro) };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticKeys: (RouteKey | undefined)[] = [
    undefined, // home
    'projects',
    'company',
    'services',
    'faq',
    'contacts',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const key of staticKeys) {
    for (const locale of locales) {
      entries.push({
        url: abs(href(locale, key)),
        changeFrequency: key === undefined || key === 'projects' ? 'weekly' : 'monthly',
        priority: key === undefined ? 1 : key === 'projects' ? 0.9 : 0.6,
        alternates: { languages: langMap(key) },
      });
    }
  }

  for (const project of projects) {
    for (const locale of locales) {
      entries.push({
        url: abs(href(locale, 'projects', project.slug)),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: langMap('projects', project.slug) },
      });
    }
  }

  return entries;
}
