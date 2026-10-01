import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { NewsBlock, NewsImage } from '@/lib/news/types';
import { getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import { Media } from '@/components/ui/Media';
import { ArrowLabel } from '@/components/ui/Button';

/**
 * Renders an article's content blocks. Each block type maps to one quiet,
 * typographic treatment; adding a type means adding a case here and a member
 * to NewsBlock — the CMS schema mirrors that union.
 */
export function ArticleBody({ blocks, locale, dict }: { blocks: NewsBlock[]; locale: Locale; dict: Dictionary }) {
  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {blocks.map((b, i) => (
        <Block key={i} block={b} locale={locale} dict={dict} />
      ))}
    </div>
  );
}

const PROSE = 'mx-auto w-full max-w-[44rem]';

function caption(img: NewsImage, locale: Locale, dict: Dictionary) {
  if (img.caption) return img.caption[locale];
  if (img.kind === 'render') return dict.news.common.render;
  if (img.kind === 'illustration') return dict.news.common.illustration;
  return undefined;
}

function Block({ block: b, locale, dict }: { block: NewsBlock; locale: Locale; dict: Dictionary }) {
  switch (b.type) {
    case 'paragraph':
      return <p className={cn(PROSE, 'text-pretty text-[1.0625rem] leading-[1.75] text-ink/90 md:text-lead')}>{typo(b.text[locale])}</p>;
    case 'heading':
      return <h2 className={cn(PROSE, 'mt-6 font-display text-display-sm font-light text-balance text-ink md:text-display-md')}>{typo(b.text[locale])}</h2>;
    case 'image':
      return (
        <figure className={cn('w-full', b.wide ? '' : PROSE)}>
          <Media src={b.image.src} alt={b.image.alt[locale]} aspect={b.image.width && b.image.height ? `${b.image.width} / ${b.image.height}` : '16 / 10'} sizes={b.wide ? '(max-width: 1680px) 92vw, 1540px' : '(max-width: 768px) 92vw, 704px'} />
          {caption(b.image, locale, dict) && <figcaption className="label mt-3 text-muted">{caption(b.image, locale, dict)}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {b.images.map((img, k) => (
            <figure key={img.src + k} className={cn(b.images.length % 2 === 1 && k === 0 && 'sm:col-span-2')}>
              <Media src={img.src} alt={img.alt[locale]} aspect={b.images.length % 2 === 1 && k === 0 ? '16 / 9' : '4 / 3'} sizes="(max-width: 640px) 92vw, 46vw" zoom />
              {caption(img, locale, dict) && <figcaption className="label mt-3 text-muted">{caption(img, locale, dict)}</figcaption>}
            </figure>
          ))}
        </div>
      );
    case 'quote':
      return (
        <blockquote className={cn(PROSE, 'border-l border-accent pl-6 md:pl-8')}>
          <p className="font-display text-display-sm font-light text-balance text-ink md:text-display-md">{typo(b.text[locale])}</p>
          {b.cite && <footer className="label mt-4 text-muted">{b.cite[locale]}</footer>}
        </blockquote>
      );
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag className={cn(PROSE, 'border-b border-line/15')}>
          {b.items.map((it, k) => (
            <li key={k} className="flex gap-5 border-t border-line/15 py-4 text-[1.0625rem] leading-relaxed text-ink/90">
              <span aria-hidden="true" className="label tabular pt-1.5 text-muted">
                {b.ordered ? String(k + 1).padStart(2, '0') : '—'}
              </span>
              <span className="text-pretty">{typo(it[locale])}</span>
            </li>
          ))}
        </Tag>
      );
    }
    case 'video': {
      const src =
        b.provider === 'youtube'
          ? `https://www.youtube-nocookie.com/embed/${b.src}`
          : b.provider === 'vimeo'
            ? `https://player.vimeo.com/video/${b.src}`
            : b.src;
      return (
        <figure className={cn(PROSE, 'relative aspect-video bg-canvas-alt')}>
          {b.provider === 'file' ? (
            <video controls preload="none" poster={b.poster} className="absolute inset-0 h-full w-full" src={src} aria-label={b.title[locale]} />
          ) : (
            <iframe title={b.title[locale]} src={src} loading="lazy" allow="fullscreen; picture-in-picture" className="absolute inset-0 h-full w-full" />
          )}
        </figure>
      );
    }
    case 'project': {
      const p = getProject(b.slug);
      if (!p) return null;
      return (
        <Link href={routes.project(locale, p.slug)} className={cn(PROSE, 'group grid grid-cols-[7rem_1fr] items-center gap-5 border border-line/15 p-4 transition-colors duration-500 ease-premium hover:border-accent/60 sm:grid-cols-[10rem_1fr] sm:gap-8')}>
          <Media src={p.cover} alt="" aspect="4 / 3" sizes="10rem" position={p.coverPosition} zoom />
          <span>
            <span className="label text-muted">{p.district[locale]}</span>
            <span className="mt-2 block font-display text-display-sm font-light text-ink">{p.name[locale]}</span>
            {b.text && <span className="mt-2 block text-sm text-muted">{typo(b.text[locale])}</span>}
            <ArrowLabel className="mt-3 text-ink">{dict.news.common.viewProject}</ArrowLabel>
          </span>
        </Link>
      );
    }
  }
}
