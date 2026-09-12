import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { foundedCity } from '@/content/site';
import { asset } from '@/lib/utils';

/**
 * Hero. Entrance uses CSS animations (compositor-driven) rather than JS, so
 * above-the-fold content is never gated on requestAnimationFrame and always
 * renders — even before hydration.
 *
 * The backdrop photo goes through next/image, NOT a CSS background-image:
 * under `basePath: /pamir` a CSS url() is not rewritten, so the static export
 * would 404 on it.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const completed = projects.filter((p) => p.status === 'completed').length;
  const inConstruction = projects.filter((p) => p.status === 'construction').length;

  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden bg-graphite-900 text-white">
      <HeroBackdrop />

      <div className="container relative z-10 pb-16 pt-32 lg:pb-24">
        <div className="max-w-3xl [&>*]:animate-fade-up">
          <span className="eyebrow text-brand" style={{ animationDelay: '0.05s' }}>
            {dict.hero.badge}
          </span>

          <h1
            className="mt-6 font-display text-display-2xl font-extrabold leading-[0.98] text-balance"
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

          {/* One button, one text link. Two equal pills read as indecision. */}
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: '0.28s' }}>
            <Link
              href={routes.projects(locale)}
              className="group inline-flex h-14 items-center justify-center gap-2 bg-brand px-8 text-[0.95rem] font-semibold uppercase tracking-wider text-graphite-900 transition-colors duration-300 ease-premium hover:bg-brand-600"
            >
              {dict.hero.ctaProjects}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={routes.contacts(locale)}
              className="link-underline text-[0.95rem] font-semibold text-white/85 transition-colors hover:text-white"
            >
              {dict.hero.ctaContact}
            </Link>
          </div>

          {/* Meta line, not a stat block — the large numerals belong to the
              proof band further down, and two sets would compete. */}
          <dl
            className="mt-12 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-xs uppercase tracking-label text-white/50"
            style={{ animationDelay: '0.4s' }}
          >
            <Fact k={foundedCity[locale]} v={locale === 'ru' ? 'Город' : 'Oraș'} />
            <Fact k={`${completed}`} v={dict.common.status.completed} />
            <Fact k={`${inConstruction}`} v={dict.common.status.construction} />
          </dl>
        </div>
      </div>

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

function HeroBackdrop() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Image
        src={asset('/photos/hero-residential.jpg')}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      {/* Scrim darkens left-to-right, so the headline column is the darkest
          part of the frame and the architecture stays readable on the right. */}
      <div className="absolute inset-0 bg-gradient-to-r from-graphite-900 via-graphite-900/85 to-graphite-900/35" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-graphite-900 to-transparent" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
