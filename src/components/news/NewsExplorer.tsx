'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { NEWS_CATEGORIES, type NewsArticle, type NewsCategory } from '@/lib/news/types';
import { cn } from '@/lib/utils';
import { NewsCard } from './NewsCard';

type Filter = 'all' | NewsCategory;

/**
 * /news list: category tabs (filter without reloading), the featured story
 * large, the rest in a 3 / 2 / 1 column grid. Receives already-published
 * articles from the repository (server side), newest first.
 */
export function NewsExplorer({
  articles,
  featuredSlug,
  locale,
  dict,
}: {
  articles: NewsArticle[];
  featuredSlug?: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const n = dict.news;
  const [filter, setFilter] = useState<Filter>('all');
  const filters: Filter[] = ['all', ...NEWS_CATEGORIES.filter((c) => articles.some((a) => a.category === c))];

  const { featured, rest } = useMemo(() => {
    const list = filter === 'all' ? articles : articles.filter((a) => a.category === filter);
    const f = filter === 'all' ? list.find((a) => a.slug === featuredSlug) ?? list[0] : list[0];
    return { featured: f, rest: list.filter((a) => a !== f) };
  }, [articles, featuredSlug, filter]);

  return (
    <div>
      <div
        role="tablist"
        aria-label={n.list.filterLabel}
        className="no-scrollbar -mx-[var(--gutter)] flex gap-x-8 overflow-x-auto border-b border-line/15 px-[var(--gutter)] md:mx-0 md:gap-x-12 md:px-0"
      >
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={cn(
                'relative min-h-[3.25rem] shrink-0 whitespace-nowrap pb-4 pt-3 text-left font-display text-display-sm font-light transition-colors duration-500 ease-premium',
                active ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {n.common.categories[f]}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-500 ease-premium',
                  active ? 'scale-x-100 bg-ink' : 'scale-x-0 bg-line/40',
                )}
              />
            </button>
          );
        })}
      </div>

      <div key={filter} className="animate-fade-up">
        {!featured ? (
          <p className="mt-16 font-display text-display-sm font-light text-muted">{n.list.empty}</p>
        ) : (
          <>
            <div className="mt-14 md:mt-20">
              <NewsCard article={featured} locale={locale} dict={dict} featured priority headingLevel="h2" />
            </div>
            {rest.length > 0 && (
              <ul role="list" className="mt-section-sm grid grid-cols-1 gap-x-gutter gap-y-16 md:grid-cols-2 md:gap-y-20 lg:grid-cols-3">
                {rest.map((a) => (
                  <li key={a.slug}>
                    <NewsCard article={a} locale={locale} dict={dict} headingLevel="h2" />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
