import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { listNews, featuredNews } from '@/lib/news/repository';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { NewsExplorer } from '@/components/news/NewsExplorer';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'news', title: dict.news.list.title, description: dict.news.list.subtitle });
}

/** News: a typographic opening, category tabs, the featured story and the grid. */
export default async function NewsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const n = dict.news;

  return (
    <>
      <PageHero eyebrow={n.common.section} title={n.list.heroTitle} subtitle={n.list.subtitle} />
      <Section spacing="none" className="pb-section">
        <NewsExplorer articles={listNews()} featuredSlug={featuredNews()?.slug} locale={locale} dict={dict} />
      </Section>
    </>
  );
}
