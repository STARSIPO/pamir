import { ArrowRight, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { foundedCity } from '@/content/site';

/**
 * Hero. Entrance uses CSS animations (compositor-driven) rather than JS/framer,
 * so above-the-fold content is never gated on requestAnimationFrame and always
 * renders — even before hydration.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const completed = projects.filter((p) => p.status === 'completed').length;
  const inConstruction = projects.filter((p) => p.status === 'construction').length;

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-graphite-900 text-white">
      <HeroBackdrop />

      <div className="container relative z-10 pb-20 pt-32">
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

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl" style={{ animationDelay: '0.2s' }}>
            {dict.hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '0.28s' }}>
            <Link
              href={routes.projects(locale)}
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-7 text-[0.95rem] font-semibold text-graphite-900 transition-all duration-300 ease-premium hover:bg-brand-600"
            >
              {dict.hero.ctaProjects}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={routes.contacts(locale)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 px-7 text-[0.95rem] font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-graphite-900"
            >
              {dict.hero.ctaContact}
            </Link>
          </div>

          <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/10 pt-8" style={{ animationDelay: '0.4s' }}>
            <Fact k={foundedCity[locale]} v={locale === 'ru' ? 'Город' : 'Oraș'} />
            <Fact k={`${completed}`} v={dict.common.status.completed} />
            <Fact k={`${inConstruction}`} v={dict.common.status.construction} />
          </dl>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/45">
          <ArrowDown className="h-4 w-4 animate-bounce" />
          {dict.common.scrollHint}
        </span>
      </div>
    </section>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-bold sm:text-3xl">{k}</dt>
      <dd className="mt-1 text-xs uppercase tracking-wider text-white/45">{v}</dd>
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-graphite-900 via-graphite-900 to-[#101113]" />
      <div className="absolute -right-32 top-1/4 h-[38rem] w-[38rem] rounded-full bg-brand/10 blur-[120px]" />
      <svg
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[46%] w-full opacity-[0.10]"
      >
        <g fill="#ffffff">
          <rect x="40" y="180" width="90" height="240" />
          <rect x="150" y="90" width="110" height="330" />
          <rect x="285" y="220" width="80" height="200" />
          <rect x="380" y="140" width="120" height="280" />
          <rect x="520" y="60" width="90" height="360" />
          <rect x="630" y="200" width="100" height="220" />
          <rect x="750" y="120" width="130" height="300" />
          <rect x="900" y="40" width="80" height="380" />
          <rect x="1000" y="180" width="110" height="240" />
          <rect x="1130" y="110" width="120" height="310" />
          <rect x="1270" y="210" width="90" height="210" />
        </g>
      </svg>
      <div className="grain absolute inset-0" />
      <span className="absolute bottom-3 right-3 z-10 rounded bg-black/30 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-white/40">
        demo
      </span>
    </div>
  );
}
