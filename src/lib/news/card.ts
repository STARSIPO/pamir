/**
 * News card data — the few fields a card shows, in one locale.
 *
 * Cards never get a whole NewsArticle: the list page hands its articles to a
 * client component, and the full model (every block of the body, in both
 * languages) would ride along in the page payload for nothing.
 */
import type { Locale } from '@/i18n/config';
import type { NewsArticle, NewsCategory, NewsImage } from './types';

export type NewsCardData = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  category: NewsCategory;
  cover: { src: string; kind?: NewsImage['kind'] };
  demo: boolean;
};

/** The card fields of an article, with the title and description in `locale`. */
export function toCardData(a: NewsArticle, locale: Locale): NewsCardData {
  return {
    slug: a.slug,
    title: a.title[locale],
    description: a.description[locale],
    date: a.date,
    category: a.category,
    cover: a.coverImage.kind ? { src: a.coverImage.src, kind: a.coverImage.kind } : { src: a.coverImage.src },
    demo: a.demo,
  };
}
