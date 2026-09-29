import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { Counter } from '@/components/ui/Counter';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { Button } from '@/components/ui/Button';
import { LeadForm } from '@/components/forms/LeadForm';
import { getFeaturedProjects } from '@/content/projects';
import { getStats, qualityFeatures } from '@/content/home';
import { contact, foundedCity } from '@/content/site';
import { routes } from '@/i18n/routing';
import { asset, cn, telHref } from '@/lib/utils';

/**
 * DIRECTION 02 — "Фасад".
 *
 * Dark, full-bleed, cinematic: the language a Chișinău buyer already reads as
 * "serious developer". Its whole argument is carried by imagery, so the
 * composition is deliberately built to LEAN on photography — the hero is a
 * photograph with type laid into its darkest corner, and the quality band is a
 * photograph with a panel floating on it. Swap the two stock atmosphere shots
 * for a real archive and this page gets better; leave them and the dependency
 * is visible, which is the point of showing it as an option.
 *
 * The named projects deliberately keep the branded DEMO placeholder: a stock
 * photo on "Botanic Star 2" would be a lie about a real building.
 */
export function FacadeHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <>
      <FacadeHero locale={locale} dict={dict} />
      <ProjectStrip locale={locale} dict={dict} />
      <ProofBand locale={locale} dict={dict} />
      <QualityBand locale={locale} dict={dict} />
      <ClosingLead locale={locale} dict={dict} />
    </>
  );
}

/* ------------------------------------------------------------------ hero --- */

function FacadeHero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const all = getFeaturedProjects();
  const completed = all.filter((p) => p.status === 'completed').length;
  const construction = all.filter((p) => p.status === 'construction').length;

  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden bg-graphite-900 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        {/* next/image, never a CSS url(): under basePath /pamir a background
            image is not rewritten and the static export 404s on it. */}
        <Image
          src={asset('/photos/hero-residential.jpg')}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        {/* Scrim runs left → right so the headline column is the darkest part
            of the frame and the architecture keeps its detail on the right. */}
        <div className="absolute inset-0 bg-gradient-to-r from-graphite-900 via-graphite-900/85 to-graphite-900/35" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-graphite-900 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      <Container className="relative z-10 pb-16 pt-32 lg:pb-24">
        {/* CSS entrance, not JS: above-the-fold type must never wait for an
            observer, and animate-fade-up only moves — opacity stays 1. */}
        <div className="max-w-3xl [&>*]:animate-fade-up">
          <span className="eyebrow" style={{ animationDelay: '0.05s' }}>
            {dict.hero.badge}
          </span>

          <h1
            className="mt-6 font-display text-display-2xl font-extrabold text-balance"
            style={{ animationDelay: '0.12s' }}
          >
            {dict.hero.title}
          </h1>

          <p
            className="mt-7 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl"
            style={{ animationDelay: '0.2s' }}
          >
            {dict.hero.subtitle}
          </p>

          {/* One solid brand button, one text link. Two equal pills read as
              indecision, and this direction has to look decided. */}
          <div
            className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={{ animationDelay: '0.28s' }}
          >
            <Button
              href={routes.projects(locale)}
              size="lg"
              arrow
              className="rounded-none px-8 uppercase tracking-wider"
            >
              {dict.hero.ctaProjects}
            </Button>
            <Link
              href={routes.contacts(locale)}
              className="link-underline text-[0.95rem] font-semibold text-white/85 transition-colors hover:text-white"
            >
              {dict.hero.ctaContact}
            </Link>
          </div>

          {/* Meta line under a hairline — facts, not a stat block. The large
              numerals belong to the proof band and two sets would compete. */}
          <dl
            className="mt-12 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-xs uppercase tracking-label text-white/45"
            style={{ animationDelay: '0.4s' }}
          >
            <Fact k={foundedCity[locale]} v={locale === 'ru' ? 'Город' : 'Oraș'} />
            <Fact k={String(completed)} v={dict.common.status.completed} />
            <Fact k={String(construction)} v={dict.common.status.construction} />
          </dl>
        </div>
      </Container>

      <span className="absolute bottom-6 right-6 z-10 hidden text-xs uppercase tracking-label text-white/35 lg:block">
        {dict.common.scrollHint}
      </span>
    </section>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-semibold text-white/85">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/* --------------------------------------------------------- project strip --- */

function ProjectStrip({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = getFeaturedProjects().slice(0, 3);

  return (
    <section className="bg-graphite-900 pt-20 text-white sm:pt-24 lg:pt-28">
      <Container className="pb-10 lg:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <Reveal>
              <span className="eyebrow">{dict.featured.eyebrow}</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-xl font-display text-display-md font-bold text-balance">
                {dict.featured.title}
              </h2>
            </Reveal>
          </div>
          <Link
            href={routes.projects(locale)}
            className="link-underline inline-flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-label text-white/70 transition-colors hover:text-brand"
          >
            {dict.featured.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>

      {/* Flush band: 1px gaps, no radius, edge to edge. Three cells read as one
          elevation rather than three separated cards. */}
      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        {featured.map((p, i) => (
          <Link
            key={p.slug}
            href={routes.project(locale, p.slug)}
            className="group relative block overflow-hidden bg-graphite-900"
          >
            {/* Real named project → no stock photo. Media with no src renders
                the branded DEMO placeholder. .mask-rise wipes it up on scroll. */}
            <Media
              alt={p.name[locale]}
              aspect="4 / 5"
              className="mask-rise"
              seed={i + 1}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-900 via-graphite-900/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
              <span
                className={cn(
                  'text-[0.65rem] font-semibold uppercase tracking-label',
                  p.status === 'construction' ? 'text-brand' : 'text-brand/60',
                )}
              >
                {dict.common.status[p.status]}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold leading-tight text-balance sm:text-2xl">
                {p.name[locale]}
              </h3>
              <p className="mt-2 text-sm text-white/55">{p.district[locale]}</p>
              <span
                aria-hidden="true"
                className="mt-4 block h-px w-10 bg-brand transition-all duration-500 ease-premium group-hover:w-20"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ proof band --- */

function ProofBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const stats = getStats();

  return (
    <Section tone="graphite">
      <Reveal>
        <span className="eyebrow">{dict.stats.eyebrow}</span>
      </Reveal>

      <dl className="mt-10 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-y-0">
        {stats.map((s, i) => (
          <Reveal key={s.label.ru} delay={i * 0.06}>
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <dd className="font-display text-6xl font-extrabold leading-none text-white lg:text-7xl">
                <Counter value={s.value} suffix={s.suffix} locale={locale} />
                {s.placeholder && <span className="align-super text-brand/70 text-2xl">*</span>}
              </dd>
              <dt className="mt-5 text-[0.7rem] font-semibold uppercase tracking-label text-white/40">
                {s.label[locale]}
              </dt>
            </div>
          </Reveal>
        ))}
      </dl>

      <Reveal delay={0.2}>
        <p className="mt-12 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/35">
          {dict.stats.note}
        </p>
      </Reveal>
    </Section>
  );
}

/* ---------------------------------------------------------- quality band --- */

function QualityBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="dark" bleed className="overflow-hidden py-24 sm:py-28 lg:py-36">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={asset('/photos/quality-site.jpg')}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        {/* Darkens toward the right, where the panel sits — the mirror of the
            hero scrim, so the two photographic screens do not read the same. */}
        <div className="absolute inset-0 bg-gradient-to-l from-graphite-900 via-graphite-900/75 to-graphite-900/35" />
        <div className="grain absolute inset-0" />
      </div>

      <Container className="relative z-10">
        <Reveal>
          {/* The only contrast panel on the page. Translucent so the
              photograph stays part of the argument instead of being covered. */}
          <div className="max-w-xl border border-white/10 bg-graphite/85 p-7 backdrop-blur-sm sm:p-10 lg:ml-auto">
            <span className="eyebrow">{dict.quality.eyebrow}</span>
            <h2 className="mt-5 font-display text-display-md font-bold text-white text-balance">
              {dict.quality.title}
            </h2>
            <span aria-hidden="true" className="rule-draw mt-6 block h-px w-16 bg-brand/70" />
            <p className="mt-5 text-[0.95rem] leading-relaxed text-white/65">
              {dict.quality.subtitle}
            </p>

            <ul className="mt-9 grid gap-x-7 gap-y-4 border-t border-white/10 pt-8 sm:grid-cols-2">
              {qualityFeatures.map((f) => (
                <li key={f.icon} className="flex items-start gap-3">
                  <FeatureIcon name={f.icon} className="h-5 w-5 shrink-0 text-brand" />
                  <span className="text-sm leading-snug text-white/80">{f.label[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ----------------------------------------------------------- closing lead -- */

function ClosingLead({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section id="lead" tone="dark">
      <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-20">
        <div>
          <Reveal>
            <span className="eyebrow">{dict.lead.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-display-lg font-extrabold text-white text-balance">
              {dict.lead.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
              {dict.lead.subtitle}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 border-t border-white/15 pt-8">
              <a
                href={telHref(contact.primaryPhone)}
                className="inline-flex items-center gap-3 font-display text-2xl font-bold text-white transition-colors hover:text-brand sm:text-3xl"
              >
                <Phone className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                {contact.primaryPhone}
              </a>
              <p className="mt-4 text-xs uppercase tracking-label text-white/40">
                {contact.hours[locale]}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <LeadForm locale={locale} dict={dict} variant="lead" tone="light" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
