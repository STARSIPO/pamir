import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { NewsArticle } from '@/lib/news/types';

/** Stub — implemented in the build step (news-list zone). Final props. */
export function NewsCard(_props: {
  article: NewsArticle;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  sizes?: string;
  headingLevel?: 'h2' | 'h3';
}) {
  return null;
}
