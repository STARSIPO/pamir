import type { MetadataRoute } from 'next';
import { locales, type Locale } from '@/i18n/config';
import { href, alternates, routes, type RouteKey } from '@/i18n/routing';
import { projects } from '@/content/projects';
import { listInventories, residentialFloors } from '@/lib/inventory/repository';
import { listNews } from '@/lib/news/repository';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

const abs = (path: string) => `${SITE_URL}${path}`;

/** Metadata routes must opt into static generation for `output: 'export'` (Next 16). */
export const dynamic = 'force-static';

function langMap(key?: RouteKey, slug?: string) {
  const alt = alternates(key, slug);
  return { ru: abs(alt.ru), ro: abs(alt.ro) };
}

/**
 * Apartment-selector pages of every project whose stock is real. While an
 * inventory is flagged `demo`, its pages are noindex and stay out of the
 * sitemap; setting `demo: false` with the real data lists them here, with no
 * other change. Paths come from the same route helpers the links use.
 */
function inventoryEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const inv of listInventories()) {
    if (inv.demo) continue;
    const slug = inv.projectSlug;
    // Availability changes daily; the stock sheet's own date is the truth.
    const push = (path: (l: Locale) => string, priority: number) => {
      const languages = { ru: abs(path('ru')), ro: abs(path('ro')) };
      for (const locale of locales) {
        entries.push({
          url: abs(path(locale)),
          lastModified: inv.updatedAt,
          changeFrequency: 'daily',
          priority,
          alternates: { languages },
        });
      }
    };
    push((l) => routes.selector(l, slug), 0.7);
    for (const b of inv.buildings) {
      push((l) => routes.building(l, slug, b.id), 0.6);
      for (const floor of residentialFloors(b)) push((l) => routes.floor(l, slug, b.id, floor), 0.5);
    }
    // A sold unit's page stays reachable from its floor plan, but is no
    // search landing page.
    for (const a of inv.apartments) {
      if (a.status !== 'sold') push((l) => routes.apartment(l, slug, a.id), 0.5);
    }
  }
  return entries;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticKeys: (RouteKey | undefined)[] = [
    undefined, // home
    'projects',
    'news',
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

  // Demo articles are noindex, so only real ones are listed.
  for (const a of listNews()) {
    if (a.demo) continue;
    for (const locale of locales) {
      entries.push({
        url: abs(href(locale, 'news', a.slug)),
        lastModified: a.date,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: langMap('news', a.slug) },
      });
    }
  }

  entries.push(...inventoryEntries());

  return entries;
}
