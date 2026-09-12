import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { companyIntro, companyQuote, principles, values } from '@/content/company';
import { projects } from '@/content/projects';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { Media } from '@/components/ui/Media';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';
import { Quality } from '@/components/home/Quality';
import { CtaBand } from '@/components/shared/CtaBand';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'company', title: dict.companyPage.title, description: dict.about.body });
}

export default async function CompanyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const completed = projects.filter((p) => p.status === 'completed');

  return (
    <>
      <PageHero eyebrow={dict.companyPage.eyebrow} title={dict.companyPage.title} subtitle={dict.about.body} />

      {/* History & philosophy + quote */}
      <Section tone="default">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <span className="eyebrow">{dict.companyPage.historyTitle}</span>
            </Reveal>
            <div className="mt-6 space-y-5">
              {companyIntro.map((p, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <p className="max-w-prose text-lg leading-relaxed text-muted text-pretty">{p[locale]}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <blockquote className="mt-10 border-l-2 border-brand pl-6 font-display text-2xl font-semibold text-ink sm:text-3xl">
                «{companyQuote[locale]}»
              </blockquote>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <Media
              src={undefined}
              alt={dict.companyPage.title}
              aspect="3 / 4"
              className="rounded-2xl"
              label={locale === 'ru' ? 'Объект компании' : 'Obiect al companiei'}
              seed={4}
            />
          </Reveal>
        </div>
      </Section>

      {/* Principles */}
      <Section tone="sand">
        <Reveal>
          <span className="eyebrow">{dict.companyPage.principlesTitle}</span>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <Reveal key={i} delay={(i % 4) * 0.06}>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-line/10 bg-white p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/12 text-brand-700">
                  <FeatureIcon name={p.icon} />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink">{p.title[locale]}</h3>
                <p className="text-sm leading-relaxed text-muted">{p.text[locale]}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Values */}
        <div className="mt-14">
          <h3 className="text-xs font-semibold uppercase tracking-label text-brand-700">{dict.companyPage.valuesTitle}</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {values.map((v, i) => (
              <span key={i} className="rounded-full border border-line/15 bg-white px-5 py-2.5 text-sm font-medium text-ink">
                {v[locale]}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Realized projects */}
      <Section tone="default">
        <div className="mb-10 max-w-2xl">
          <Reveal>
            <span className="eyebrow">{dict.companyPage.projectsTitle}</span>
          </Reveal>
        </div>
        <ProjectsExplorer projects={completed} locale={locale} dict={dict} showFilters={false} />
      </Section>

      {/* Quality & technologies (reused) */}
      <Quality locale={locale} dict={dict} />

      <CtaBand locale={locale} dict={dict} title={dict.companyPage.contactTitle} subtitle={dict.lead.subtitle} />
    </>
  );
}
