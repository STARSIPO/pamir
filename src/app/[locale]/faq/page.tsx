import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { telHref } from '@/lib/utils';
import { faq } from '@/content/faq';
import { contact } from '@/content/site';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/shared/Accordion';
import { CtaBand } from '@/components/shared/CtaBand';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'faq', title: dict.faqPage.title, description: dict.faqPage.subtitle });
}

/**
 * FAQ: the questions take the wide right column; on large screens a small
 * sales block stays pinned on the left while the list scrolls. On phones and
 * tablets that block is left out — the CtaBand below carries the same number.
 */
export default async function FaqPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const sales = contact.phones[0];

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

      <Section spacing="none" className="pb-section">
        <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-gutter">
          <aside className="hidden lg:col-span-3 lg:block" aria-label={sales.label[locale]}>
            <Reveal className="sticky top-32 border-t border-line/15 pt-7">
              <p className="label text-muted">{sales.label[locale]}</p>
              <p className="mt-10 max-w-[30ch] text-pretty text-base leading-relaxed text-muted">
                {dict.faqPage.ctaSubtitle}
              </p>
              <a
                href={telHref(sales.number)}
                className="link-line mt-8 inline-block font-display text-display-sm font-light tabular text-ink"
              >
                {sales.number}
              </a>
              {/* The block's label already names the sales team, so the link
                  keeps the short "contact us" wording — "contact the sales
                  department" ran past three columns in RO/RU. whitespace-normal
                  lets any longer label wrap inside the column, arrow last. */}
              <div className="mt-10">
                <Button
                  href={routes.contacts(locale)}
                  variant="ghost"
                  arrow
                  className="max-w-full justify-start whitespace-normal text-left"
                >
                  {dict.common.contactUs}
                </Button>
              </div>
            </Reveal>
          </aside>

          <Reveal className="lg:col-span-8 lg:col-start-5">
            <Accordion items={faq} locale={locale} headingLevel="h2" />
          </Reveal>
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.faqPage.ctaTitle} subtitle={dict.faqPage.ctaSubtitle} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
