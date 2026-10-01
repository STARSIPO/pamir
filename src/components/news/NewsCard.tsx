import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { NewsArticle } from '@/lib/news/types';
import { routes } from '@/i18n/routing';
import { formatNewsDate } from '@/lib/news/format';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import { Media } from '@/components/ui/Media';
import { ArrowLabel } from '@/components/ui/Button';

/**
 * News card: image, date · category, title, a short description and
 * «Подробнее →». No frame and no shadow — the photo zooms ~3% slowly on hover
 * and the arrow moves; the card itself never jumps.
 *
 * `featured` lays the card out large (photo 7 cols, text 5) for the newest
 * story on /news.
 */
export function NewsCard({
  article,
  locale,
  dict,
  priority = false,
  sizes = '(max-width: 767px) 92vw, (max-width: 1023px) 46vw, 30vw',
  headingLevel = 'h3',
  featured = false,
}: {
  article: NewsArticle;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  sizes?: string;
  headingLevel?: 'h2' | 'h3';
  featured?: boolean;
}) {
  const n = dict.news.common;
  const Heading = headingLevel;
  const caption =
    article.coverImage.kind === 'render' ? n.render : article.coverImage.kind === 'illustration' ? n.illustration : undefined;

  return (
    <Link
      href={routes.newsArticle(locale, article.slug)}
      className={cn('group block', featured && 'md:grid md:grid-cols-12 md:items-end md:gap-gutter')}
    >
      <div className={cn(featured && 'md:col-span-7')}>
        <Media
          src={article.coverImage.src}
          alt=""
          aspect={featured ? '16 / 10' : '4 / 3'}
          sizes={featured ? '(max-width: 767px) 92vw, 56vw' : sizes}
          priority={priority}
          caption={caption}
          label={article.title[locale]}
          zoom
        />
      </div>
      <div className={cn('mt-6', featured && 'md:col-span-5 md:mt-0 md:pb-2')}>
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
          <time dateTime={article.date}>{formatNewsDate(article.date, locale)}</time>
          <span aria-hidden="true">·</span>
          <span>{n.categories[article.category]}</span>
          {article.demo && (
            <span className="border border-accent/40 px-1.5 py-0.5 text-accent">{n.demoBadge}</span>
          )}
        </p>
        <Heading
          className={cn(
            'mt-4 font-display font-light text-balance text-ink',
            featured ? 'text-display-md md:text-display-lg' : 'text-display-sm',
          )}
        >
          {typo(article.title[locale])}
        </Heading>
        <p className={cn('mt-4 text-pretty leading-relaxed text-muted', featured ? 'text-base md:text-lead' : 'line-clamp-3 text-[0.9375rem]')}>
          {typo(article.description[locale])}
        </p>
        <ArrowLabel className="mt-6 text-ink">{featured ? n.readMoreLong : n.readMore}</ArrowLabel>
      </div>
    </Link>
  );
}
