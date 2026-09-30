import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { routes } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { Media } from '@/components/ui/Media';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Art direction per photograph: where the building sits in the frame.
 * `portrait` drives phones and tablets held upright (the frame is cropped
 * sideways, so x matters); `landscape` drives desktops (cropped top/bottom,
 * so y matters). Unlisted projects fall back to the centre.
 *
 * `inset` marks a source too small to fill a wide screen: 1200–1400px renders
 * that a full-bleed frame at 1920 upscales 1.5×, into visible blockiness. From
 * `xl` those heroes become a split, the photograph in the right seven columns
 * at close to native size, the name on the dark ground beside it; the value is
 * the crop for that frame. Below `xl` the sources still cover the screen
 * natively, so the hero stays full-bleed. (Better still: ≥2400px renders.)
 *
 * `aspect` is the source's width / height; `heroSizes` needs it to tell the
 * browser how wide the photograph is really painted.
 */
type Art = { aspect: number; portrait: string; landscape: string; inset?: string };
const ART: Record<string, Art> = {
  'botanic-star-2-blocks-3-4': { aspect: 1.21, portrait: '22% 50%', landscape: '50% 38%', inset: '14% 50%' },
  'eco-house': { aspect: 1.78, portrait: '40% 50%', landscape: '50% 45%' },
  'botanic-star-2-block-2': { aspect: 1.375, portrait: '50% 50%', landscape: '50% 30%', inset: '50% 50%' },
  'botanic-star-2-block-1': { aspect: 2.165, portrait: '57% 50%', landscape: '50% 50%' },
  'botanic-star': { aspect: 0.67, portrait: '50% 50%', landscape: '50% 16%', inset: '50% 6%' },
  'botanic-park': { aspect: 1.51, portrait: '44% 50%', landscape: '50% 38%' },
};
const CENTRE: Art = { aspect: 1.5, portrait: '50% 50%', landscape: '50% 45%' };

/** The hero's min-height floor, px (see the section's min-h). */
const HERO_MIN_H = 620;

/**
 * `sizes` for the hero photograph: the width it is painted at, not the
 * screen's. The frame is at least a screen tall, so wherever the screen is
 * narrower than the source (every upright phone and tablet, and 16:10
 * desktops for Eco House), object-cover paints it height-bound — aspect ×
 * 100vh wide. Eco House on a 390×844 phone is 1500px wide; "100vw" made the
 * browser fetch a 640px file and stretch it 2–4×. Below 620px of height the
 * floor takes over. The xl split frame is ~58% of the width and a screen
 * tall, so there a landscape render is height-bound almost always.
 */
function heroSizes({ aspect }: Art, inset: boolean) {
  const ratio = (r: number) => `${Math.round(r * 1000)}/1000`;
  const tall = `${Math.ceil(aspect * 100)}vh`;
  const floor = Math.ceil(aspect * HERO_MIN_H);
  return [
    ...(inset ? [`(min-width: 1280px) and (max-aspect-ratio: ${ratio(aspect / 0.6)}) ${tall}`, '(min-width: 1280px) 60vw'] : []),
    `(max-height: ${HERO_MIN_H}px) and (max-width: ${floor}px) ${floor}px`,
    `(max-aspect-ratio: ${ratio(aspect)}) ${tall}`,
    '100vw',
  ].join(', ');
}

/**
 * Container edges, measured on the section (so `100%` is its width): the
 * inset photograph starts at the sixth column and runs out to the screen
 * edge; its caption lines up with the container's right edge.
 */
const EDGE = 'calc(max(0px, (100% - 1680px) / 2) + var(--gutter))';
const INSET_LEFT = `calc(${EDGE} + (min(100%, 1680px) - 2 * var(--gutter)) * 5 / 12)`;

/**
 * Line-break hygiene for a display-size name: a dash never starts a line and
 * a number never leaves the word it belongs to ("Star 2", "блоки 3", "и 4").
 */
const typeset = (s: string) => s.replace(/ ([—–]|\d+\b)/g, ' $1');

/**
 * Full-width on phones, and allowed to wrap: the RO labels outgrow 350px.
 * A wrapped label is balanced, so "AFLĂ DESPRE / APARTAMENTELE LIBERE" never
 * leaves one word alone beside the arrow.
 */
const fitPhone =
  'w-full sm:w-auto max-sm:h-auto max-sm:min-h-14 max-sm:whitespace-normal max-sm:px-5 max-sm:py-4 max-sm:text-center max-sm:tracking-[0.12em] max-sm:[text-wrap:balance]';

/** Honesty label for renders, set like Media's caption so it holds on any sky. */
const captionText = 'label text-white/85 [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]';

/**
 * Project opening: the building fills the screen, the name sits on the
 * bottom edge in the largest cut of the display face. The transparent header
 * floats over the top, so a short top scrim keeps it legible on bright skies.
 *
 *   ПРОЕКТЫ / BOTANIC STAR                               ВИЗУАЛИЗАЦИЯ
 *   ■ СДАН
 *   Botanic Star
 *   ───────────────────────────────────────────────────────────────
 *   Tagline                                    [ Узнать о квартирах → ]
 *   БОТАНИКА · АДРЕС                           [ Планировки ]
 *
 * Inset heroes at xl (see ART), the header wholly on the dark ground:
 *
 *   PAMIR                         О компании  Проекты  …  [ Связаться ]
 *                             ┌───────────────────────────────────────
 *   ПРОЕКТЫ / BOTANIC STAR    │
 *   ■ СДАН                    │
 *   Botanic                   │            photograph, columns 6–12,
 *   Star                      │            bleeding off the right edge
 *   ───────────────────       │
 *   Tagline                   │
 *   БОТАНИКА                  │
 *   [ Узнать о квартирах → ]  │
 *   Планировки →              │                          ВИЗУАЛИЗАЦИЯ
 */
export function ProjectHero({
  project,
  locale,
  dict,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
}) {
  const name = project.name[locale];
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;
  const hasFloorplans = project.floorplans.length > 0;
  const caption = project.coverKind === 'render' ? dict.design.render : undefined;
  const art = ART[project.slug] ?? CENTRE;
  const inset = !!art.inset;
  const place = [project.district[locale], project.address?.[locale]].filter(Boolean).join(' · ');

  return (
    <section
      className="relative flex min-h-[max(100svh,620px)] flex-col overflow-hidden bg-scrim text-white"
      style={
        {
          '--focus-p': art.portrait,
          '--focus-l': art.landscape,
          ...(inset && { '--focus-i': art.inset, '--inset-l': INSET_LEFT, '--edge': EDGE }),
        } as CSSProperties
      }
    >
      {/* The photograph. Inset heroes redefine the crop for the xl frame on
          this wrapper, so the image's own portrait/landscape rules pick it up.
          At xl the inset plate also starts under the header: the transparent
          header then sits wholly on the dark ground, and no nav link is cut
          in half by the photograph's edge. */}
      <div
        className={cn(
          'absolute inset-0',
          inset &&
            'xl:left-[var(--inset-l)] xl:top-[var(--header-h)] xl:[--focus-l:var(--focus-i)] xl:[--focus-p:var(--focus-i)]',
        )}
      >
        <Media
          src={project.hero ?? project.cover}
          alt={name}
          fill
          priority
          sizes={heroSizes(art, inset)}
          seed={1}
          label={name}
          showTag={false}
          className="bg-scrim"
          imgClassName="animate-hero-zoom [object-position:var(--focus-p)] landscape:[object-position:var(--focus-l)]"
        />
        {inset && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-scrim/45 to-transparent xl:block"
          />
        )}
      </div>
      {inset && caption && (
        <span
          className={cn(
            captionText,
            'absolute bottom-[clamp(1.75rem,4.5vw,4.5rem)] right-[var(--edge)] z-10 hidden xl:block',
          )}
        >
          {caption}
        </span>
      )}

      {/* Scrims: a short one under the header; a tall one under the text,
          dense enough at mid-height to carry the small labels over a white
          façade; and a wash from the left behind the text column. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-scrim/55 to-transparent',
          inset && 'xl:hidden',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 bottom-0 h-[88%] bg-gradient-to-t from-scrim/90 via-scrim/60 to-transparent',
          inset && 'xl:hidden',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 hidden w-2/3 bg-gradient-to-r from-scrim/45 via-scrim/15 to-transparent md:block',
          inset && 'xl:hidden',
        )}
      />

      <Container className="relative z-10 flex flex-1 flex-col justify-end pb-[clamp(1.75rem,4.5vw,4.5rem)] pt-[calc(var(--header-h)+1.5rem)]">
        <div className={cn(inset && 'xl:w-5/12 xl:pr-16')}>
          {/* On phones the header logo and the back gesture do this job, and
              the building needs the height more. */}
          <div className="animate-hero-in max-md:hidden" style={{ animationDelay: '0.15s' }}>
            <nav aria-label={dict.projectsPage.eyebrow} className="min-w-0">
              <ol className="label flex min-w-0 items-center gap-3 text-white/85">
                <li className="shrink-0">
                  <Link
                    href={routes.projects(locale)}
                    className="link-line inline-flex min-h-11 items-center transition-colors duration-500 hover:text-white"
                  >
                    {dict.projectsPage.eyebrow}
                  </Link>
                </li>
                <li aria-hidden="true" className="shrink-0 text-white/50">
                  /
                </li>
                <li aria-current="page" className="truncate text-white">
                  {name}
                </li>
              </ol>
            </nav>
          </div>

          <div className="animate-hero-in md:mt-8" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center justify-between gap-6">
              <StatusBadge
                status={project.status}
                label={statusLabel}
                className="text-white/90 [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]"
              />
              {caption && <span className={cn(captionText, 'shrink-0', inset && 'xl:hidden')}>{caption}</span>}
            </div>
            <h1
              className={cn(
                'mt-5 font-display text-hero font-light text-balance text-white md:mt-6',
                inset && 'xl:text-display-xl',
              )}
            >
              {typeset(name)}
            </h1>
          </div>

          <div
            className={cn(
              'mt-6 grid gap-6 border-t border-white/20 pt-5 animate-hero-in md:mt-12 md:gap-8 md:pt-9 lg:grid-cols-12 lg:items-end lg:gap-gutter',
              inset && 'xl:mt-10 xl:grid-cols-1 xl:gap-8 xl:pt-8',
            )}
            style={{ animationDelay: '0.4s' }}
          >
            <div className={cn('lg:col-span-6 xl:col-span-5', inset && 'xl:col-span-1')}>
              <p className="max-w-[36ch] text-pretty text-lead text-white/80">{project.tagline[locale]}</p>
              <p className="label mt-4 text-white/70">{place}</p>
            </div>
            <div
              className={cn(
                'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-6 lg:justify-end xl:col-span-7',
                inset && 'xl:col-span-1 xl:flex-col xl:items-start xl:justify-start xl:gap-4',
              )}
            >
              <Button href="#lead" variant="light" size="lg" arrow className={fitPhone}>
                {dict.projectDetail.availableApartments}
              </Button>
              {hasFloorplans && (
                <>
                  {/* One boxed action per view on phones and in the narrow
                      inset column; the plans link steps down to a text link. */}
                  <Button
                    href="#floorplans"
                    variant="outlineLight"
                    size="lg"
                    className={cn('max-sm:hidden', inset && 'xl:hidden')}
                  >
                    {dict.projectDetail.viewFloorplans}
                  </Button>
                  <Button
                    href="#floorplans"
                    variant="ghost"
                    arrow
                    className={cn(
                      'min-h-11 self-start text-white/85 hover:text-white sm:hidden',
                      inset && 'xl:inline-flex',
                    )}
                  >
                    {dict.projectDetail.viewFloorplans}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
