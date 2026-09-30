import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { Media } from '@/components/ui/Media';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typo } from '@/lib/text';
import { splitTied, typesetName } from './ProjectFeature';

/** The one project shown full-bleed between the featured rows and the advantages. */
export const SPOTLIGHT_SLUG = 'botanic-star-2-block-1';

/**
 * A pause in the page: one photograph edge to edge, nothing else competing.
 * The name sits over the lower third under a scrim; the caption marking the
 * render closes the eyebrow row, well clear of the fixed header, so the frame
 * is never shown unlabelled while it fills the screen.
 *
 * The render is 2.16:1 and object-cover fills the frame's height, so on any
 * screen narrower than that the photo is drawn far wider than the viewport:
 * `sizes` asks for the width actually drawn (like the Hero), or a phone would
 * upscale a 640px file 2x. On phones the frame is shorter (72svh) and the
 * focal point shifts right, so the crop holds the tower's edge — the orange
 * fin, the dark return — against the evening sky, and the building reads as a
 * volume rather than a flat grid of windows.
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
      className="relative isolate h-[72svh] min-h-[500px] max-h-[880px] overflow-hidden bg-scrim text-white md:h-[82svh] md:min-h-[520px] md:max-h-[960px] lg:h-[88svh] lg:min-h-[560px] lg:max-h-[1000px]"
    >
      <Reveal variant="mask" className="absolute inset-0">
        <Media
          src={project.hero ?? project.cover}
          alt={name}
          label={name}
          fill
          // Drawn width = frame height × 2.165 whenever that beats 100vw:
          // 72svh → 156vh on phones, 82svh → 178vh on tablets, 88svh → 191vh
          // from lg (until the screen is wider than 19:10).
          sizes="(max-width: 767px) 156vh, (max-width: 1023px) and (max-aspect-ratio: 16/9) 178vh, (min-width: 1024px) and (max-aspect-ratio: 19/10) 191vh, 100vw"
          imgClassName="object-[70%_50%] md:object-[57%_50%]"
        />
      </Reveal>

      <div className="absolute inset-x-0 bottom-0">
        {/* Wash, at every width. No top scrim: the header over this section is
            always the compact one with its own background. The text block
            covers the lower half of the frame, so a gradient sized to the
            section would leave the eyebrow row at a different depth on every
            screen height — on a laptop it sat on the sunset at a quarter
            density. This one is pinned to the text block, as in the Hero: an
            eased 10rem ramp ends right at the eyebrow row, then deepens slowly
            to the button. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 bottom-0"
          style={{ backgroundImage: WASH }}
        />
        <Container className="relative pb-12 md:pb-16 lg:pb-20">
          {/* nowrap: "PRIM-PLAN" must not break at its hyphen. The hairline
              grows from 1rem up to its full length, so it gives way first;
              only on the narrowest phones does the render caption drop to its
              own line (still right-aligned). */}
          <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 md:flex-nowrap">
            <span className="label whitespace-nowrap">{dict.design.spotlightEyebrow}</span>
            <span aria-hidden="true" className="h-px min-w-4 max-w-10 flex-1 bg-white/40 md:max-w-16" />
            {isRender && <span className="label ml-auto whitespace-nowrap text-right">{dict.design.render}</span>}
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
                {typo(project.tagline[locale])}
              </p>
            </div>
            <Button href={routes.project(locale, project.slug)} variant="outlineLight" arrow className="shrink-0">
              {dict.common.viewProject}
            </Button>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}

/**
 * Wash, measured from the top of the text block's backdrop (10rem above the
 * eyebrow row). The ramp eases in over those 10rem so it never reads as a
 * band across the tower, and reaches 64% exactly at the eyebrow: enough for
 * the white/90 labels and the light-weight name to clear 4.5:1 where they
 * cross the white façade on a phone or the low sun on a laptop, in every
 * theme (the scrim stays near-black). Mirrors the Hero's phone wash so the
 * two photo frames read as one system.
 */
const WASH = `linear-gradient(to bottom,
  rgb(var(--scrim) / 0) 0,
  rgb(var(--scrim) / 0.1) 2.5rem,
  rgb(var(--scrim) / 0.3) 5rem,
  rgb(var(--scrim) / 0.5) 7.5rem,
  rgb(var(--scrim) / 0.64) 10rem,
  rgb(var(--scrim) / 0.7) 45%,
  rgb(var(--scrim) / 0.86) 100%)`;
