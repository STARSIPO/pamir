import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { Media } from '@/components/ui/Media';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { splitTied, typesetName } from './ProjectFeature';

/** The one project shown full-bleed between the featured rows and the advantages. */
export const SPOTLIGHT_SLUG = 'botanic-star-2-block-1';

/**
 * A pause in the page: one photograph edge to edge, nothing else competing.
 * The name sits over the lower third under a scrim, the caption marking the
 * render sits in the opposite corner.
 *
 * The frame is shorter on phones (78svh) and the focal point is set on the
 * tower, which sits right of centre in the wide render, so a portrait crop
 * keeps the building rather than the sky or the playground.
 */
export function Spotlight({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const project = getProject(SPOTLIGHT_SLUG);
  if (!project) return null;

  const name = project.name[locale];
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;
  const isRender = project.coverKind === 'render';

  return (
    <section
      aria-labelledby="spotlight-title"
      className="relative isolate h-[78svh] min-h-[520px] max-h-[880px] overflow-hidden bg-scrim text-white md:h-[82svh] md:max-h-[960px] lg:h-[88svh] lg:min-h-[560px] lg:max-h-[1000px]"
    >
      <Reveal variant="mask" className="absolute inset-0">
        <Media
          src={project.hero ?? project.cover}
          alt={name}
          label={name}
          fill
          sizes="100vw"
          position="57% 50%"
        />
      </Reveal>

      {/* Scrims: a deep one under the text, a light one at the top so the
          caption and the header keep their contrast against the sky. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-scrim/90 via-scrim/50 to-transparent md:h-[72%] md:from-scrim/85 md:via-scrim/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-scrim/35 to-transparent"
      />

      {isRender && (
        <Container className="pointer-events-none absolute inset-x-0 top-0 flex justify-end pt-6 md:pt-8">
          <span className="label text-white/75">{dict.design.render}</span>
        </Container>
      )}

      <Container className="absolute inset-x-0 bottom-0 pb-12 md:pb-16 lg:pb-20">
        <Reveal className="flex items-center gap-4 text-white/75">
          <span className="label">{dict.design.spotlightEyebrow}</span>
          <span aria-hidden="true" className="h-px w-10 bg-white/40 md:w-16" />
        </Reveal>

        <Reveal stagger className="mt-6 md:mt-8">
          {/* Greedy wrap, not balance: on a phone it fills the first line
              ("Botanic Star 2 —") instead of leaving one word on its own. */}
          <h2 id="spotlight-title" className="font-display text-display-xl font-light text-white">
            {splitTied(typesetName(name))}
          </h2>
        </Reveal>

        <Reveal
          delay={0.16}
          className="mt-8 flex flex-col items-start gap-8 border-t border-white/20 pt-7 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-12 md:pt-8"
        >
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-white/75">
              <StatusBadge status={project.status} label={statusLabel} className="text-white" />
              <span aria-hidden="true" className="label">
                ·
              </span>
              <span className="label">{project.district[locale]}</span>
            </div>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-white/75 md:text-[1.0625rem]">
              {project.tagline[locale]}
            </p>
          </div>
          <Button href={routes.project(locale, project.slug)} variant="outlineLight" arrow className="shrink-0">
            {dict.common.viewProject}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
