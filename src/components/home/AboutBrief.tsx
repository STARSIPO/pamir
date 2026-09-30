import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { projects } from '@/content/projects';
import { splitWords, typesetName, typo } from '@/lib/text';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Arrow, Button } from '@/components/ui/Button';

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
 *   СДАННЫЕ ОБЪЕКТЫ (lg+, cols 1–7)
 *   ─────────────────────────   ─────────────────────────
 *   Botanic Park            ⟶   Botanic Star            ⟶
 *   ─────────────────────────   ─────────────────────────
 *   Botanic Star 2 — блок 1 ⟶   Botanic Star 2 — блок 2 ⟶
 *   ─────────────────────────   ─────────────────────────
 *
 * One display voice: the title is the statement, the paragraph beside it
 * supports it at lead size. On desktop the statement is backed by the names
 * of the completed objects it refers to (client decision 2026-09-30,
 * DESIGN-SYSTEM §3): names only, set quieter than the lead, as a two-column
 * spec sheet whose hairlines break at the gutter. No counts, years or
 * districts here: the completed / under-construction counts belong to
 * 03 Advantages, and repeating them two screens earlier only pads the page.
 * Tablet and phone keep the statement alone.
 */
export function AboutBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // filter() already returns a fresh array, so sorting it leaves `projects` alone.
  const built = projects
    .filter((p) => p.status === 'completed')
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));

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
            390px screen's measure. On desktop it holds row 1 alone, so
            that row is only as tall as the title and the index below
            starts right under it. */}
        <Reveal stagger className="col-span-4 md:col-span-10 lg:col-span-7 lg:row-start-1">
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
            first x-height up with the title's cap line. On desktop it
            spans both rows, so its height never stretches row 1. */}
        <div className="col-span-4 md:col-span-8 md:col-start-5 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:pt-[0.4rem]">
          <Reveal delay={0.08}>
            <p className="max-w-[40ch] text-pretty text-lead text-muted">{typo(dict.about.body)}</p>
          </Reveal>
          <Reveal delay={0.16} className="mt-8 md:mt-10">
            <Button href={routes.company(locale)} variant="ghost" arrow>
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>

        {/* The completed objects the statement refers to — names only, at
            body size, under the title in cols 1–7. Desktop only: on tablet
            and phone the lead already sits under the title and a list
            there would only lengthen the scroll. */}
        <Reveal
          delay={0.24}
          className="hidden lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:block lg:pt-4"
        >
          <p className="label text-muted">{dict.design.fill.home.builtLabel}</p>
          <ul className="mt-6 grid grid-cols-2 gap-x-gutter [&>li:nth-last-child(-n+2)]:border-b [&>li]:border-line/15">
            {built.map((p) => (
              <li key={p.slug} className="border-t border-line/15">
                <Link
                  href={routes.project(locale, p.slug)}
                  className="group flex min-h-11 items-center justify-between gap-4 py-4 text-base text-ink md:text-[1.0625rem]"
                >
                  <span className="link-line">{typesetName(p.name[locale])}</span>
                  <Arrow className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
