import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { faq } from '@/content/faq';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Accordion } from '@/components/shared/Accordion';
import { CtaBand } from '@/components/shared/CtaBand';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'faq', title: dict.faqPage.title, description: dict.faqPage.subtitle });
}

export default function FaqPage({ params }: { params: { locale: string } }) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q[locale],
      acceptedAnswer: { '@type': 'Answer', text: f.a[locale] },
    })),
  };

  return (
    <>
      <PageHero eyebrow={dict.faqPage.eyebrow} title={dict.faqPage.title} subtitle={dict.faqPage.subtitle} />

      <Section tone="default">
        <div className="mx-auto max-w-3xl">
          <Accordion items={faq} locale={locale} />
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.faqPage.ctaTitle} subtitle={dict.faqPage.ctaSubtitle} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
