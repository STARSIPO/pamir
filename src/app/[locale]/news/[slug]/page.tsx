import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { getNews, newsSlugs, relatedNews } from '@/lib/news/repository';
import { formatNewsDate } from '@/lib/news/format';
import { getProject } from '@/content/projects';
import { typo } from '@/lib/text';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { Button } from '@/components/ui/Button';
import { NewsCard } from '@/components/news/NewsCard';
import { ArticleBody } from '@/components/news/ArticleBody';
import { DemoNotice } from '@/components/inventory/DemoNotice';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => newsSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata(props: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const a = getNews(params.slug);
  if (!a) return {};
  const title = (a.seo?.title ?? a.title)[locale];
  const description = (a.seo?.description ?? a.description)[locale];
  const base = buildMetadata({ locale, routeKey: 'news', slug: a.slug, title, description });
  // Absolute, basePath-safe image URL for link previews.
  const ogImage = `${SITE_URL}${a.seo?.ogImage ?? a.coverImage.src}`;
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: a.date,
      images: [{ url: ogImage, alt: a.coverImage.alt[locale] }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    robots: a.demo ? { index: false, follow: true } : base.robots,
  };
}

/** One article: category • date, title, standfirst, cover, body, project, more news. */
export default async function NewsArticlePage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const a = getNews(params.slug);
  if (!a) notFound();
  const dict = getDictionary(locale);
  const n = dict.news;
  const project = a.relatedProject ? getProject(a.relatedProject) : undefined;
  const more = relatedNews(a, 3);
  const coverCaption = a.coverImage.kind === 'render' ? n.common.render : a.coverImage.kind === 'illustration' ? n.common.illustration : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title[locale],
    description: a.description[locale],
    datePublished: a.date,
    image: [`${SITE_URL}${a.coverImage.src}`],
    inLanguage: locale === 'ro' ? 'ro-MD' : 'ru-MD',
    author: { '@type': 'Organization', name: 'Pamir Construct' },
    publisher: { '@type': 'Organization', name: 'Pamir Construct' },
    mainEntityOfPage: `${SITE_URL}${routes.newsArticle(locale, a.slug)}`,
  };

  return (
    <>
      <article>
        <Container className="pt-[clamp(3rem,7vw,6.5rem)]">
          <div className="mx-auto max-w-[56rem]">
            <Reveal className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
              <span>{n.common.categories[a.category]}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={a.date}>{formatNewsDate(a.date, locale)}</time>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-6 font-display text-display-lg font-light text-balance text-ink md:text-display-xl">{typo(a.title[locale])}</h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[40rem] text-pretty text-lead text-muted">{typo(a.subtitle[locale])}</p>
            </Reveal>
            {a.demo && <DemoNotice badge={n.common.demoBadge} text={n.common.demoNotice} className="mt-8" />}
          </div>

          <Reveal variant="mask" className="mt-12 md:mt-16">
            <Media
              src={a.coverImage.src}
              alt={a.coverImage.alt[locale]}
              aspect="16 / 9"
              sizes="(max-width: 1680px) 92vw, 1540px"
              priority
              caption={coverCaption}
            />
          </Reveal>

          <div className="py-section-sm">
            <ArticleBody blocks={a.content} locale={locale} dict={dict} />

            {project && (
              <div className="mx-auto mt-14 flex max-w-[44rem] flex-wrap items-center justify-between gap-6 border-t border-line/15 pt-8">
                <div>
                  <p className="label text-muted">{n.article.relatedProject}</p>
                  <p className="mt-2 font-display text-display-sm font-light text-ink">{project.name[locale]}</p>
                </div>
                <Button href={routes.project(locale, project.slug)} variant="outline" arrow>
                  {n.common.viewProject}
                </Button>
              </div>
            )}
          </div>
        </Container>
      </article>

      {more.length > 0 && (
        <Section tone="alt" spacing="sm">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-display-md font-light text-ink">{n.article.other}</h2>
            <Button href={routes.news(locale)} variant="ghost" arrow>
              {n.common.backToAll}
            </Button>
          </div>
          <ul role="list" className="mt-12 grid grid-cols-1 gap-x-gutter gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => (
              <li key={m.slug}>
                <NewsCard article={m} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
