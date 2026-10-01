/**
 * News — domain model.
 *
 * The shape mirrors what a CMS collection / admin panel will hold, so the
 * site never depends on where articles come from (local modules today,
 * Sanity / Payload / Strapi / a custom admin later). Every admin action maps
 * onto a field:
 *
 *   add / edit / delete article   → one NewsArticle document
 *   upload cover, add a gallery   → coverImage, images, gallery blocks
 *   choose category               → category
 *   link to a project             → relatedProject (+ `project` blocks)
 *   set the date                  → date
 *   make it featured              → featured
 *   publish / hide                → status
 *
 * Article bodies are an ordered list of typed blocks (portable-text style), so
 * an editor can compose text, headings, photos, galleries, quotes, lists,
 * videos and project links without HTML.
 */
import type { Localized } from '@/content/types';

export type NewsCategory = 'company' | 'projects' | 'construction' | 'events';

export const NEWS_CATEGORIES: NewsCategory[] = ['company', 'projects', 'construction', 'events'];

export type NewsStatus = 'published' | 'hidden';

/** An image as an editor uploads it. `kind: 'render'` is captioned as a visualisation. */
export interface NewsImage {
  src: string;
  alt: Localized;
  caption?: Localized;
  kind?: 'photo' | 'render' | 'illustration';
  /** Intrinsic size, px — lets layouts request the right file and avoid shifts. */
  width?: number;
  height?: number;
}

export type NewsBlock =
  | { type: 'paragraph'; text: Localized }
  | { type: 'heading'; text: Localized }
  | { type: 'image'; image: NewsImage; wide?: boolean }
  | { type: 'gallery'; images: NewsImage[] }
  | { type: 'quote'; text: Localized; cite?: Localized }
  | { type: 'list'; ordered?: boolean; items: Localized[] }
  /** Future: YouTube / Vimeo id or a hosted file URL. */
  | { type: 'video'; provider: 'youtube' | 'vimeo' | 'file'; src: string; title: Localized; poster?: string }
  /** A card linking to a residential project (by project slug). */
  | { type: 'project'; slug: string; text?: Localized };

export interface NewsSeo {
  title?: Localized;
  description?: Localized;
  /** Open Graph image path in /public; defaults to coverImage.src. */
  ogImage?: string;
}

export interface NewsArticle {
  id: string;
  /** URL slug, shared by both locales: /ru/news/<slug>, /ro/noutati/<slug>. */
  slug: string;
  title: Localized;
  /** One-line standfirst under the title. */
  subtitle: Localized;
  /** 1–2 sentences for cards and the meta description. */
  description: Localized;
  content: NewsBlock[];
  /** ISO date (YYYY-MM-DD). */
  date: string;
  category: NewsCategory;
  coverImage: NewsImage;
  /** Extra images attached to the article (admin "gallery" upload). */
  images: NewsImage[];
  /** Slug of a residential project in src/content/projects.ts. */
  relatedProject?: string;
  featured?: boolean;
  author?: Localized;
  status: NewsStatus;
  /** True for demonstration posts: shown with a "Демо" mark, noindex, out of the sitemap. */
  demo: boolean;
  seo?: NewsSeo;
}
