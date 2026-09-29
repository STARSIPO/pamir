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

/**
 * Art direction per photograph: where the building sits in the frame.
 * `portrait` drives phones and tablets held upright (the frame is cropped
 * sideways, so x matters); `landscape` drives desktops (cropped top/bottom,
 * so y matters). Unlisted projects fall back to the centre.
 */
const FOCUS: Record<string, { portrait: string; landscape: string }> = {
  'botanic-star-2-blocks-3-4': { portrait: '22% 50%', landscape: '50% 38%' },
  'eco-house': { portrait: '40% 50%', landscape: '50% 45%' },
  'botanic-star-2-block-2': { portrait: '50% 50%', landscape: '50% 30%' },
  'botanic-star-2-block-1': { portrait: '57% 50%', landscape: '50% 50%' },
  'botanic-star': { portrait: '50% 50%', landscape: '50% 16%' },
  'botanic-park': { portrait: '44% 50%', landscape: '50% 38%' },
};
const CENTRE = { portrait: '50% 50%', landscape: '50% 45%' };

/**
 * Line-break hygiene for a display-size name: a dash never starts a line and
 * a number never leaves the word it belongs to ("Star 2", "блоки 3", "и 4").
 */
const typeset = (s: string) => s.replace(/ ([—–]|\d+\b)/g, ' $1');

/** Full-width on phones, and allowed to wrap: the RO labels outgrow 350px. */
const fitPhone =
  'w-full sm:w-auto max-sm:h-auto max-sm:min-h-14 max-sm:whitespace-normal max-sm:px-5 max-sm:py-4 max-sm:text-center';

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
  const focus = FOCUS[project.slug] ?? CENTRE;
  const place = [project.district[locale], project.address?.[locale]].filter(Boolean).join(' · ');

  return (
    <section
      className="relative h-[100svh] min-h-[620px] overflow-hidden bg-scrim text-white"
      style={{ '--focus-p': focus.portrait, '--focus-l': focus.landscape } as CSSProperties}
    >
      <Media
        src={project.hero ?? project.cover}
        alt={name}
        fill
        priority
        sizes="100vw"
        seed={1}
        label={name}
        showTag={false}
        className="bg-scrim"
        imgClassName="animate-hero-zoom [object-position:var(--focus-p)] landscape:[object-position:var(--focus-l)]"
      />

      {/* Scrims: a short one under the header, a tall one under the text. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-scrim/55 to-transparent" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-scrim/90 via-scrim/45 to-transparent"
      />

      <Container className="relative z-10 flex h-full flex-col justify-end pb-[clamp(1.75rem,4.5vw,4.5rem)] pt-[calc(var(--header-h)+1.5rem)]">
        <div className="animate-hero-in" style={{ animationDelay: '0.15s' }}>
          <nav aria-label={dict.projectsPage.eyebrow} className="min-w-0">
            <ol className="label flex min-w-0 items-center gap-3 text-white/70">
              <li className="shrink-0">
                <Link
                  href={routes.projects(locale)}
                  className="link-line inline-flex min-h-11 items-center transition-colors duration-500 hover:text-white"
                >
                  {dict.projectsPage.eyebrow}
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0 text-white/40">
                /
              </li>
              <li aria-current="page" className="truncate text-white/90">
                {name}
              </li>
            </ol>
          </nav>
        </div>

        <div className="mt-5 animate-hero-in md:mt-8" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between gap-6">
            <StatusBadge status={project.status} label={statusLabel} className="text-white/85" />
            {caption && <span className="label shrink-0 text-white/60">{caption}</span>}
          </div>
          <h1 className="mt-5 font-display text-hero font-light text-balance text-white md:mt-6">{typeset(name)}</h1>
        </div>

        <div
          className="mt-8 grid gap-8 border-t border-white/20 pt-7 animate-hero-in md:mt-12 md:pt-9 lg:grid-cols-12 lg:items-end lg:gap-gutter"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="lg:col-span-6 xl:col-span-5">
            <p className="max-w-[36ch] text-pretty text-lead text-white/75">{project.tagline[locale]}</p>
            <p className="label mt-4 text-white/60">{place}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-6 lg:justify-end xl:col-span-7">
            <Button href="#lead" variant="light" size="lg" arrow className={fitPhone}>
              {dict.projectDetail.availableApartments}
            </Button>
            {hasFloorplans && (
              <Button href="#floorplans" variant="outlineLight" size="lg" className={fitPhone}>
                {dict.projectDetail.viewFloorplans}
              </Button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
