import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

/** Metadata routes must opt into static generation for `output: 'export'` (Next 16). */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // /preview/ holds the competing design directions and demo inventory —
    // a decision aid for the client, never a page for buyers.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/ru/preview/', '/ro/preview/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
