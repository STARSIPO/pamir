import type { Metadata } from 'next';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { services } from '@/content/services';
import { routes } from '@/i18n/routing';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { CtaBand } from '@/components/shared/CtaBand';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'services', title: dict.servicesPage.title, description: dict.servicesPage.subtitle });
}

export default function ServicesPage({ params }: { params: { locale: string } }) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero eyebrow={dict.servicesPage.eyebrow} title={dict.servicesPage.title} subtitle={dict.servicesPage.subtitle} />

      <Section tone="default">
        <div className="grid gap-6 lg:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.06}>
              <article className="flex h-full flex-col rounded-2xl border border-line/10 bg-white p-8 transition-shadow duration-500 hover:shadow-card">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand-700">
                    <FeatureIcon name={s.icon} />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">{s.title[locale]}</h2>
                    <p className="mt-2 leading-relaxed text-muted">{s.summary[locale]}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 border-t border-line/10 pt-5">
                  {s.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {pt[locale]}
                    </li>
                  ))}
                </ul>
                <Link
                  href={routes.contacts(locale)}
                  className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink link-underline"
                >
                  {dict.common.getConsultation}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.servicesPage.ctaTitle} subtitle={dict.lead.subtitle} />
    </>
  );
}
