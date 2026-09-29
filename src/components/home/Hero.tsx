import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getProject } from '@/content/projects';
import { companyLegalName } from '@/content/site';
import { routes } from '@/i18n/routing';
import { splitWords } from '@/lib/text';
import { Media } from '@/components/ui/Media';
import { Button } from '@/components/ui/Button';

/**
 * Home hero — one photograph, one sentence, one action.
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ (transparent header)                                      │
 *   │                                                           │
 *   │              Eco House, full-bleed                        │
 *   │                                                           │
 *   │ ── PAMIR CONSTRUCT                                        │
 *   │ Строим                                                    │
 *   │ пространство                        short subtitle        │
 *   │ для жизни                           [ Смотреть проекты → ]│
 *   │ ───────────────────────────────────────────────────────── │
 *   │ На изображении — Eco House · Визуализация    Листайте  │  │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Motion is CSS only (compositor-driven): the photo settles from a 1.08 zoom,
 * the slogan rises word by word, the rest follows on a short ladder. Nothing
 * waits for hydration, and under reduced motion every block is simply there.
 *
 * The photo is the LCP element: `priority`, no mask reveal, and it goes
 * through next/image (a CSS url() would miss the /pamir basePath).
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const project = getProject('eco-house');
  const src = project?.hero ?? project?.cover;
  const name = project?.name[locale] ?? '';
  const isRender = project?.coverKind === 'render';

  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-scrim text-white">
      {/* Photograph. The building sits left of centre in the frame: on a
          portrait phone the crop holds its corner tower, on desktop the
          whole block reads with the sky above it. */}
      <div className="absolute inset-0 animate-hero-zoom motion-reduce:animate-none">
        <Media
          src={src}
          alt={name}
          fill
          priority
          // object-cover on a 16:9 frame: on any screen narrower than 16:9 the
          // photo is drawn ~178vh wide, not 100vw — ask for that width so a
          // portrait phone does not upscale a 640px source.
          sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
          className="bg-scrim"
          imgClassName="object-[24%_50%] md:object-[32%_50%] lg:object-[40%_45%]"
        />
      </div>

      {/* Scrims: a light one under the transparent header, a deeper one under
          the text. From tablet up the slogan crosses the white façade, so a
          lateral wash backs the text column only; the top of the building and
          the right half of the frame stay untouched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-scrim/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-scrim/85 via-scrim/40 via-55% to-transparent lg:h-[80%] lg:via-scrim/35 lg:via-45%"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[72%] bg-gradient-to-r from-scrim/45 via-scrim/15 to-transparent md:block"
      />

      <div className="relative z-10 flex h-full flex-col justify-end pt-[calc(var(--header-h)+1.5rem)]">
        <div className="container">
          <div className="grid-12 gap-y-9 lg:items-end">
            <div className="col-span-4 md:col-span-12 lg:col-span-8">
              <p
                className="label flex items-center gap-4 text-white/75 animate-hero-in motion-reduce:animate-none"
                style={delay(0.1)}
              >
                <span aria-hidden="true" className="h-px w-10 bg-white/50" />
                {companyLegalName}
              </p>
              <h1 className="mt-6 max-w-[13ch] font-display text-hero font-light text-balance md:mt-8 [&_.word]:animate-hero-in [&_.word]:[animation-delay:calc(0.18s_+_var(--i)_*_80ms)] motion-reduce:[&_.word]:animate-none">
                {splitWords(dict.hero.title)}
              </h1>
            </div>

            <div
              className="col-span-4 flex flex-col items-start gap-8 animate-hero-in motion-reduce:animate-none md:col-span-7 lg:col-span-4 lg:pb-[0.35rem] xl:pl-6"
              style={delay(0.5)}
            >
              <p className="max-w-[36ch] text-pretty text-lead text-white/75">{dict.hero.subtitle}</p>
              <Button href={routes.projects(locale)} variant="light" size="lg" arrow>
                {dict.hero.ctaProjects}
              </Button>
            </div>
          </div>

          <div
            className="mt-12 flex items-center justify-between gap-6 border-t border-white/20 py-5 animate-hero-in motion-reduce:animate-none md:mt-16 md:py-6"
            style={delay(0.65)}
          >
            <p className="label text-white/60">
              {/* The prefix drops on phones so the caption holds one line. */}
              <span className="hidden sm:inline">{dict.design.onImage} — </span>
              {name}
              {isRender && <> · {dict.design.render}</>}
            </p>
            <p aria-hidden="true" className="label hidden shrink-0 items-center gap-4 text-white/60 sm:flex">
              {dict.common.scrollHint}
              <ScrollLine />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function delay(s: number): CSSProperties {
  return { animationDelay: `${s}s` };
}

/**
 * A 1px track with a short segment sliding down it — the one sanctioned
 * looping motion on the site. Reuses the `hero-in` keyframes played in reverse
 * (visible at the top → faded out lower down); reduced motion leaves the
 * segment at rest.
 */
function ScrollLine() {
  return (
    <span className="relative block h-9 w-px overflow-hidden bg-white/20">
      <span className="absolute inset-x-0 top-0 block h-3 bg-white/80 animate-[hero-in_2.4s_cubic-bezier(0.65,0,0.35,1)_infinite_reverse] motion-reduce:animate-none" />
    </span>
  );
}
