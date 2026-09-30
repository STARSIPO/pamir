import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { Button } from '@/components/ui/Button';
import { companyIntro, companyQuote } from '@/content/company';
import { getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { splitWords, typo } from '@/lib/text';

/** The photograph is a render of Botanic Star 2, block 1 (docs/IMAGE-CREDITS.md). */
const PHOTO = '/photos/projects/company/about.jpg';
const PHOTO_PROJECT = 'botanic-star-2-block-1';

/**
 * 05 — Company. One photograph and one sentence.
 *
 *   05 — КОМПАНИЯ ─────────────────────────────────────────────────
 *
 *   ┌────────────────────────┐
 *   │                        │        Дом — это
 *   │   render, portrait     │        крепость.
 *   │   (mask reveal,        │
 *   │    slow hover zoom)    │
 *   │                        │        intro, muted
 *   │                        │        Подробнее о компании ──→
 *   └────────────────────────┘
 *
 * The quote sits at the top of its column and the intro at the bottom, so the
 * text column is held by the photograph's edges rather than floating beside
 * it. The section has no bottom padding: Steps continues the same chapter.
 */
export function CompanyBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photoProject = getProject(PHOTO_PROJECT);
  const alt = photoProject ? `${photoProject.name[locale]} — ${dict.design.render}` : companyQuote[locale];

  return (
    <Section tone="canvas" className="pb-0" aria-labelledby="company-brief-title">
      <div className="flex items-center gap-4">
        <Reveal className="shrink-0">
          <h2 id="company-brief-title" className="label flex items-center gap-3 text-muted">
            <span aria-hidden="true" className="tabular">
              05
            </span>
            <span aria-hidden="true">—</span>
            <span>{dict.design.companyEyebrow}</span>
          </h2>
        </Reveal>
        <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
      </div>

      <div className="mt-10 grid gap-y-12 md:mt-14 md:gap-y-16 lg:grid-cols-12 lg:gap-x-gutter">
        {/* Mask reveal: the global [data-mask] rule clips this inner frame,
            leaving the observed wrapper unclipped (see globals.css). */}
        <Reveal variant="mask" className="lg:col-span-6">
          <div className="relative aspect-[4/5] md:aspect-[3/2] lg:aspect-[4/5]">
            <Media
              src={PHOTO}
              alt={alt}
              fill
              zoom
              caption={dict.design.render}
              position="50% 55%"
              // The 16:9 source is cropped to 4:5 / 3:2, so the file must be
              // wider than the frame: request by the cropped-away width too.
              sizes="(max-width: 767px) 222vw, (max-width: 1023px) 119vw, 100vw"
            />
          </div>
        </Reveal>

        <div className="flex flex-col gap-12 md:grid md:grid-cols-12 md:gap-x-gutter lg:col-span-5 lg:col-start-8 lg:flex lg:justify-between lg:gap-16 lg:py-1">
          <figure className="md:col-span-6 lg:col-span-full">
            <span aria-hidden="true" className="rule-draw block h-px w-12 bg-accent" />
            <Reveal stagger className="mt-8 md:mt-10">
              <blockquote>
                <p className="font-display text-display-lg font-light text-balance text-ink">
                  {splitWords(companyQuote[locale])}
                </p>
              </blockquote>
            </Reveal>
          </figure>

          <Reveal delay={0.12} className="md:col-span-6 md:col-start-7 md:self-end lg:self-auto">
            <p className="max-w-md text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
              {typo(companyIntro[0][locale])}
            </p>
            <Button href={routes.company(locale)} variant="ghost" arrow className="mt-10">
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
