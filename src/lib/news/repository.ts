/**
 * News repository — the ONLY way views read articles.
 *
 * Today it serves the local modules in src/content/news. To connect a CMS or
 * admin panel, keep these signatures and change the bodies (fetch at build
 * time for the static export; async + fetch with revalidation on a Node
 * host). Views never import src/content/news directly.
 */
import type { NewsArticle, NewsCategory } from './types';
import { newsArticles } from '@/content/news';

function published(): NewsArticle[] {
  return newsArticles
    .filter((a) => a.status === 'published')
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id)));
}

export interface NewsQuery {
  category?: NewsCategory;
  /** Only articles linked to this project slug. */
  project?: string;
  limit?: number;
}

/** Published articles, newest first. */
export function listNews(q: NewsQuery = {}): NewsArticle[] {
  let list = published();
  if (q.category) list = list.filter((a) => a.category === q.category);
  if (q.project) list = list.filter((a) => a.relatedProject === q.project || a.content.some((b) => b.type === 'project' && b.slug === q.project));
  return q.limit ? list.slice(0, q.limit) : list;
}

export function getNews(slug: string): NewsArticle | undefined {
  return published().find((a) => a.slug === slug);
}

/** The featured article: the newest one flagged `featured`, else the newest. */
export function featuredNews(): NewsArticle | undefined {
  const list = published();
  return list.find((a) => a.featured) ?? list[0];
}

export function latestNews(limit = 3): NewsArticle[] {
  return published().slice(0, limit);
}

/** "Другие новости": same project first, then same category, then newest. */
export function relatedNews(article: NewsArticle, limit = 3): NewsArticle[] {
  const others = published().filter((a) => a.slug !== article.slug);
  const score = (a: NewsArticle) =>
    (article.relatedProject && a.relatedProject === article.relatedProject ? 2 : 0) + (a.category === article.category ? 1 : 0);
  return [...others].sort((a, b) => score(b) - score(a) || (a.date < b.date ? 1 : -1)).slice(0, limit);
}

/** Static params for /[locale]/news/[slug]. */
export function newsSlugs(): string[] {
  return published().map((a) => a.slug);
}
