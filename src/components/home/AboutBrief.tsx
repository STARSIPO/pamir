import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { splitWords, typo } from '@/lib/text';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';

/**
 * 01 — About. One statement, a lot of air, no photograph.
 *
 *   01 — О КОМПАНИИ ───────────────────────────────────────────────
 *
 *   Надёжность,                                   Pamir Construct создаёт
 *   подтверждённая                                жилые проекты, … (lead,
 *   построенными объектами                        muted, cols 9–12)
 *   (display-lg, light, cols 1–7)                 ПОДРОБНЕЕ О КОМПАНИИ ⟶
 *
 * One display voice: the title is the statement, the paragraph beside it
 * supports it at lead size, and nothing else follows. No facts row: the
 * completed / under-construction counts belong to 03 Advantages, and
 * repeating them two screens earlier only pads the page.
 */
export function AboutBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="canvas" id="about" aria-labelledby="about-title">
      {/* Label row — the same pattern SectionHeading draws. */}
      <div className="flex items-center gap-4">
        <Reveal className="label flex shrink-0 items-center gap-3 text-muted">
          <span className="tabular">01</span>
          <span aria-hidden="true">—</span>
          <span>{dict.about.eyebrow}</span>
        </Reveal>
        <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
      </div>

      <div className="mt-14 grid-12 gap-y-10 md:mt-20 md:gap-y-14 lg:mt-28">
        {/* The title IS the statement: the one display voice in the block.
            Phones take it one step down (display-md) so it sets as a
            sentence in two or three lines, not a column of single words:
            at display-lg "построенными объектами" alone is wider than a
            390px screen's measure. */}
        <Reveal stagger className="col-span-4 md:col-span-10 lg:col-span-7">
          <h2
            id="about-title"
            className="font-display text-display-md font-light text-balance text-ink sm:text-display-lg"
          >
            {splitWords(dict.about.title)}
          </h2>
        </Reveal>

        {/* Supporting copy steps right: under the title from col 5 on
            tablet, beside it in cols 9–12 on desktop, on the same col-9
            edge as the hero subtitle. The optical offset lines the lead's
            first x-height up with the title's cap line. */}
        <div className="col-span-4 md:col-span-8 md:col-start-5 lg:col-span-4 lg:col-start-9 lg:pt-[0.4rem]">
          <Reveal delay={0.08}>
            <p className="max-w-[40ch] text-pretty text-lead text-muted">{typo(dict.about.body)}</p>
          </Reveal>
          <Reveal delay={0.16} className="mt-8 md:mt-10">
            <Button href={routes.company(locale)} variant="ghost" arrow>
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
