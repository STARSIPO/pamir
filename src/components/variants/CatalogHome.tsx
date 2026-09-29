import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { Button } from '@/components/ui/Button';
import { projects } from '@/content/projects';
import { getStats, qualityFeatures, steps } from '@/content/home';
import { contact, foundedCity } from '@/content/site';
import { routes } from '@/i18n/routing';
import { splitWords } from '@/lib/text';
import { cn, telHref } from '@/lib/utils';

/**
 * DIRECTION 01 — "Каталог".
 *
 * The homepage as the contents page of an architectural monograph: no
 * photograph above the fold, the first screen is the h1 plus an index of the
 * six real projects with their status. Everything here runs on data the client
 * already has, which is the whole argument for this direction.
 *
 * Geometry rule for the direction: squares only. No radius, no shadow, no card
 * fill — structure is carried by hairlines and by the type scale alone.
 */
export function CatalogHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const completed = projects.filter((p) => p.status === 'completed').length;
  const construction = projects.filter((p) => p.status === 'construction').length;

  // Meta row under the h1 — every fact derived from src/content, never written.
  const facts: { value: string; label?: string }[] = [
    { value: foundedCity[locale] },
    { value: String(completed), label: dict.common.status.completed },
    { value: String(construction), label: dict.common.status.construction },
  ];

  const stats = getStats();
  const hasPlaceholders = stats.some((s) => s.placeholder);

  return (
    <>
      {/* ============================================================
          HERO — typography only. Sand ground, flush left, no image.
          ============================================================ */}
      <Section tone="sand" className="pb-0">
        <Reveal>
          <span className="eyebrow">{dict.hero.badge}</span>
        </Reveal>

        <Reveal delay={0.05} stagger>
          <h1 className="mt-7 max-w-[16ch] font-display text-display-2xl font-extrabold tracking-[-0.045em] text-ink">
            {splitWords(dict.hero.title)}
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="mt-10 flex flex-wrap items-baseline text-[0.7rem] uppercase tracking-label text-muted sm:mt-12 sm:text-xs">
            {facts.map((f, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-baseline gap-2 whitespace-nowrap py-1',
                  i > 0 && 'ml-4 border-l border-line/15 pl-4 sm:ml-7 sm:pl-7',
                )}
              >
                <span className="tabular font-semibold text-ink">{f.value}</span>
                {f.label && <span>{f.label}</span>}
              </li>
            ))}
          </ul>
        </Reveal>

        <span aria-hidden="true" className="rule-draw mt-10 block h-px w-24 bg-brand/70" />
      </Section>

      {/* ============================================================
          PROJECT INDEX — table rows, not cards. Same sand ground as the
          hero so the first screen reads as one continuous page.
          ============================================================ */}
      <Section tone="sand" className="pt-14 sm:pt-16 lg:pt-20">
        <SectionHeading eyebrow={dict.featured.eyebrow} title={dict.featured.title} />

        <ol className="mt-12 border-t border-line/15 sm:mt-16">
          {projects.map((p, i) => {
            const place = [p.district[locale], p.address?.[locale]].filter(Boolean).join(' · ');
            return (
              <li key={p.slug} className="border-b border-line/15">
                <Link
                  href={routes.project(locale, p.slug)}
                  className="group grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 py-6 sm:grid-cols-[3rem_minmax(0,1.15fr)_minmax(0,1fr)_max-content] sm:gap-x-6 sm:py-8 lg:gap-x-10"
                >
                  <span className="tabular block text-xs font-semibold text-muted transition-colors duration-300 ease-premium group-hover:text-brand sm:text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="block font-display text-xl font-bold leading-tight text-ink transition-transform duration-500 ease-premium group-hover:translate-x-1 sm:text-2xl lg:text-[1.7rem]">
                    {p.name[locale]}
                  </span>

                  <span className="col-start-2 block text-sm leading-snug text-muted transition-transform duration-500 ease-premium group-hover:translate-x-1 sm:col-start-3">
                    {place}
                  </span>

                  <span
                    className={cn(
                      'col-start-2 block text-[0.7rem] font-semibold uppercase tracking-label transition-transform duration-500 ease-premium group-hover:translate-x-1 sm:col-start-4 sm:text-right',
                      p.status === 'construction' ? 'text-brand-700' : 'text-muted',
                    )}
                  >
                    {dict.common.status[p.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-10">
          <Link
            href={routes.projects(locale)}
            className="link-underline text-sm font-semibold uppercase tracking-label text-ink"
          >
            {dict.common.viewAllProjects}
          </Link>
        </div>
      </Section>

      {/* ============================================================
          FIGURES — four oversized numerals split by vertical hairlines.
          ============================================================ */}
      <Section tone="default">
        <SectionHeading eyebrow={dict.stats.eyebrow} title={dict.stats.title} />

        <div className="mt-14 grid grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={i}
              delay={(i % 4) * 0.07}
              className={cn(
                'border-line/15 py-8 sm:py-10',
                i % 2 === 1 && 'border-l pl-5 sm:pl-8',
                i >= 2 && 'border-t lg:border-t-0',
                'lg:border-l lg:pl-8',
                i === 0 && 'lg:border-l-0 lg:pl-0',
              )}
            >
              {/* The numeral is the headline; the label is demoted under it. */}
              <span className="block font-display text-display-xl font-extrabold leading-[0.9] tracking-[-0.04em] text-ink">
                <Counter value={s.value} suffix={s.suffix} locale={locale} />
              </span>
              <span className="mt-5 block text-[0.7rem] uppercase tracking-label text-muted">
                {s.label[locale]}
                {s.placeholder && <span className="text-brand"> *</span>}
              </span>
            </Reveal>
          ))}
        </div>

        {hasPlaceholders && <p className="mt-10 text-xs text-muted/80">{dict.stats.note}</p>}
      </Section>

      {/* ============================================================
          QUALITY — hairline grid, no photograph anywhere in this direction.
          ============================================================ */}
      <Section tone="stone">
        <SectionHeading
          eyebrow={dict.quality.eyebrow}
          title={dict.quality.title}
          subtitle={dict.quality.subtitle}
        />

        <div className="mt-14 grid grid-cols-2 gap-px bg-line/12 sm:grid-cols-3 lg:grid-cols-4">
          {qualityFeatures.map((f, i) => (
            <Reveal key={f.icon + i} delay={(i % 4) * 0.05} className="bg-stone">
              <div className="flex h-full items-start gap-3 p-5 sm:gap-4 sm:p-6">
                <FeatureIcon name={f.icon} className="h-5 w-5 shrink-0 text-brand-700" />
                <span className="text-sm font-medium leading-snug text-ink">{f.label[locale]}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ============================================================
          STEPS — the process, kept to a compact hairline grid.
          ============================================================ */}
      <Section tone="default">
        <SectionHeading eyebrow={dict.steps.eyebrow} title={dict.steps.title} />

        <ol className="mt-12 grid gap-px bg-line/12 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.n} className="bg-white">
              <Reveal delay={(i % 3) * 0.06} className="h-full p-5 sm:p-7">
                <span className="tabular block text-xs font-semibold tracking-label text-brand-700">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
                  {s.title[locale]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text[locale]}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============================================================
          CLOSING — the only near-black ground in this direction.
          ============================================================ */}
      <Section tone="dark" id="lead">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">
          <div>
            <Reveal>
              <span className="eyebrow">{dict.lead.eyebrow}</span>
            </Reveal>
            <Reveal delay={0.05} stagger>
              <h2 className="mt-5 font-display text-display-lg font-bold tracking-[-0.03em] text-white text-balance">
                {splitWords(dict.lead.title)}
              </h2>
            </Reveal>
            <span aria-hidden="true" className="rule-draw mt-6 block h-px w-16 bg-brand/70" />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-prose text-lg leading-relaxed text-white/65">
                {dict.lead.subtitle}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="flex flex-col items-start gap-7">
            <a
              href={telHref(contact.primaryPhone)}
              className="font-display text-3xl font-bold tracking-[-0.03em] text-white transition-colors duration-300 ease-premium hover:text-brand sm:text-4xl"
            >
              {contact.primaryPhone}
            </a>
            <p className="text-xs uppercase tracking-label text-white/45">
              {contact.hours[locale]}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href={routes.contacts(locale)} className="rounded-none" arrow>
                {dict.hero.ctaContact}
              </Button>
              <Button href={routes.projects(locale)} variant="outlineLight" className="rounded-none">
                {dict.common.viewAllProjects}
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
