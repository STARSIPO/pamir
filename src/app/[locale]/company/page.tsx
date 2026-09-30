import type { Metadata } from 'next';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { splitWords } from '@/lib/text';
import { companyIntro, companyQuote, principles, values } from '@/content/company';
import { projects } from '@/content/projects';
import { companyLegalName } from '@/content/site';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { Media } from '@/components/ui/Media';
import { Button } from '@/components/ui/Button';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';
import { Quality } from '@/components/home/Quality';
import { CtaBand } from '@/components/shared/CtaBand';

/** Render of Botanic Star 2, block 1 (see docs/IMAGE-CREDITS.md). */
const COMPANY_IMAGE = '/photos/projects/company/about.jpg';

const pad = (n: number) => String(n).padStart(2, '0');

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'company', title: dict.companyPage.title, description: dict.about.body });
}

/**
 * Company page.
 *
 *   PageHero      label, H1, lead
 *   History       the intro as one large statement, then the quote set huge
 *   Photograph    a wide render, mask reveal
 *   Principles    sticky title left, a hairline 2×2 grid right
 *   Values        the same split, an indexed hairline list
 *   Quality       shared with the homepage
 *   Projects      completed projects, large cards
 *   CtaBand       closing call to action on the band
 */
export default async function CompanyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const completed = projects.filter((p) => p.status === 'completed');
  // The project the photograph belongs to, so the caption can name it.
  const pictured = projects.find((p) => p.gallery.includes(COMPANY_IMAGE) || p.cover === COMPANY_IMAGE);
  const [quoteOpen, quoteClose] = locale === 'ro' ? ['„', '”'] : ['«', '»'];

  return (
    <>
      <PageHero eyebrow={dict.companyPage.eyebrow} title={dict.companyPage.title} subtitle={dict.about.body} />

      {/* ── History & philosophy ─────────────────────────────────────── */}
      <Section spacing="none" className="pb-section pt-4 md:pt-8" aria-labelledby="company-history">
        <div className="flex items-center gap-4">
          <Reveal className="shrink-0">
            <h2 id="company-history" className="label text-muted">
              {dict.companyPage.historyTitle}
            </h2>
          </Reveal>
          <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
        </div>

        <div className="mt-12 grid gap-y-10 md:mt-20 md:grid-cols-12 md:gap-x-gutter">
          <Reveal className="md:col-span-11 lg:col-span-10">
            {/* A multi-line statement: display-md's 1.08 leading is tuned for one-
                or two-line names, so the lines get more air here. */}
            <p className="font-display text-display-md font-light leading-[1.2] text-pretty text-ink md:leading-[1.16]">
              {companyIntro[0][locale]}
            </p>
          </Reveal>
          {companyIntro.slice(1).map((p, i) => (
            <Reveal key={i} delay={0.08} className="md:col-span-7 md:col-start-6 md:mt-10 lg:col-span-5 lg:col-start-7">
              <p className="text-lead text-pretty text-muted">{p[locale]}</p>
            </Reveal>
          ))}
        </div>

        {/* The quote: one line of the company's own voice, set as large as a title. */}
        <figure className="mt-section grid gap-y-8 border-t border-line/15 pt-10 md:grid-cols-12 md:gap-x-gutter md:pt-14">
          <Reveal stagger className="md:col-span-12 lg:col-span-9 lg:col-start-4">
            <blockquote>
              <p className="font-display text-display-xl font-light text-balance text-ink">
                {splitWords(`${quoteOpen}${companyQuote[locale]}${quoteClose}`)}
              </p>
            </blockquote>
          </Reveal>
          <figcaption className="label text-muted md:col-span-12 lg:order-first lg:col-span-3 lg:pt-4">
            {companyLegalName}
          </figcaption>
        </figure>

        {/* A wide photograph: the frame opens from its lower edge. */}
        <div className="mt-section-sm">
          <Reveal
            variant="mask"
            className="relative aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[2/1]"
          >
            {/* The 16:9 render is cropped into taller frames on small screens,
                so `sizes` asks for the width the crop really needs:
                4/5 → ≈2.2× the frame width, 4/3 → ≈1.33×. The tower sits in
                the middle third, so a centred crop keeps all of it. */}
            <Media
              src={COMPANY_IMAGE}
              alt={pictured ? pictured.name[locale] : dict.companyPage.title}
              fill
              position="50% 18%"
              sizes="(max-width: 639px) 225vw, (max-width: 767px) 135vw, (max-width: 1680px) 100vw, 1680px"
              caption={dict.design.render}
            />
          </Reveal>
          {/* Label over value on phones, one line from sm: no dash separator
              (the project name already carries one). The link's 44px hit area
              is an ::after, so it does not push the line down. */}
          {pictured && (
            <p className="label mt-5 flex flex-col items-start gap-2 text-muted sm:flex-row sm:items-baseline sm:gap-3">
              <span>{dict.design.onImage}:</span>
              <Link
                href={routes.project(locale, pictured.slug)}
                className="link-rule relative pb-1 text-ink after:absolute after:-inset-y-4 after:inset-x-0 after:content-['']"
              >
                {pictured.name[locale]}
              </Link>
            </p>
          )}
        </div>
      </Section>

      {/* ── Principles & values ──────────────────────────────────────── */}
      <Section spacing="none" className="pb-section" aria-labelledby="company-principles">
        <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-gutter">
          <div className="lg:col-span-4">
            <Reveal stagger className="lg:sticky lg:top-32">
              <h2 id="company-principles" className="font-display text-display-lg font-light text-balance text-ink">
                {splitWords(dict.companyPage.principlesTitle)}
              </h2>
            </Reveal>
          </div>

          <ol className="grid gap-x-gutter gap-y-14 md:grid-cols-2 md:gap-y-20 lg:col-span-8">
            {principles.map((p, i) => (
              <Reveal as="li" key={p.icon + i} delay={(i % 2) * 0.08} className="border-t border-line/15 pt-6">
                <div className="flex items-center justify-between text-muted">
                  <span className="label tabular">{pad(i + 1)}</span>
                  <FeatureIcon name={p.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-10 font-display text-display-sm font-light text-balance text-ink md:mt-14">
                  {p.title[locale]}
                </h3>
                <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted">{p.text[locale]}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-section grid gap-y-12 lg:grid-cols-12 lg:gap-x-gutter">
          <div className="lg:col-span-4">
            <Reveal stagger>
              <h2 className="font-display text-display-lg font-light text-balance text-ink">
                {splitWords(dict.companyPage.valuesTitle)}
              </h2>
            </Reveal>
          </div>

          <ul className="grid md:grid-cols-2 md:gap-x-gutter lg:col-span-8">
            {values.map((v, i) => (
              <Reveal
                as="li"
                key={v.ru}
                delay={(i % 2) * 0.06}
                className="flex items-baseline gap-6 border-t border-line/15 py-5 last:border-b md:py-7 md:[&:nth-last-child(2)]:border-b"
              >
                <span className="label tabular w-6 shrink-0 text-muted">{pad(i + 1)}</span>
                <span className="font-display text-display-sm font-light text-ink">{v[locale]}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Quality (shared with the homepage) ───────────────────────── */}
      <Quality locale={locale} dict={dict} />

      {/* ── Completed projects ───────────────────────────────────────── */}
      <Section>
        <SectionHeading
          eyebrow={dict.featured.eyebrow}
          title={dict.companyPage.projectsTitle}
          action={
            <Button href={routes.projects(locale)} variant="ghost" arrow className="self-start">
              {dict.common.viewAllProjects}
            </Button>
          }
        />
        <div className="mt-14 md:mt-20">
          <ProjectsExplorer projects={completed} locale={locale} dict={dict} showFilters={false} />
        </div>
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.companyPage.contactTitle} subtitle={dict.lead.subtitle} />
    </>
  );
}
