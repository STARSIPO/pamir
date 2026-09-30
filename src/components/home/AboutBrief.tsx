import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { foundedCity } from '@/content/site';
import { routes } from '@/i18n/routing';
import { splitWords } from '@/lib/text';
import { cn } from '@/lib/utils';
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
 *   ───────────────────────────────────────────────────────────────
 *   Кишинёв                4                      2
 *   ОФИС                   ЗАВЕРШЁННЫЕ            В СТРОИТЕЛЬСТВЕ
 *
 * One display voice: the title is the statement, the paragraph under it
 * supports it at lead size. The facts row sits on the same 12-column grid
 * (4 · 4 · 4), so the copy column starts exactly over a fact (the second on
 * tablet, the third on desktop). Counts are derived from the project list,
 * never typed in.
 */
export function AboutBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const completed = projects.filter((p) => p.status === 'completed').length;
  const inConstruction = projects.filter((p) => p.status === 'construction').length;

  const facts = [
    { k: 'city', value: foundedCity[locale], label: dict.contactsPage.officeTitle, tabular: false },
    { k: 'completed', value: String(completed), label: dict.common.filters.completed, tabular: true },
    { k: 'construction', value: String(inConstruction), label: dict.common.filters.construction, tabular: true },
  ];

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
        {/* The title IS the statement: the one display voice in the block. */}
        <Reveal stagger className="col-span-4 md:col-span-10 lg:col-span-7">
          <h2
            id="about-title"
            className="font-display text-display-lg font-light text-balance text-ink"
          >
            {splitWords(dict.about.title)}
          </h2>
        </Reveal>

        {/* Supporting copy steps right, always onto a fact column's edge:
            under the title from col 5 on tablet, beside it in cols 9–12 on
            desktop. The optical offset lines the lead's first x-height up
            with the title's cap line. */}
        <div className="col-span-4 md:col-span-8 md:col-start-5 lg:col-span-4 lg:col-start-9 lg:pt-[0.4rem]">
          <Reveal delay={0.08}>
            <p className="max-w-[40ch] text-pretty text-lead text-muted">{bindDashes(dict.about.body)}</p>
          </Reveal>
          <Reveal delay={0.16} className="mt-8 md:mt-10">
            <Button href={routes.company(locale)} variant="ghost" arrow>
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>
      </div>

      <Reveal
        as="dl"
        delay={0.1}
        className="mt-20 grid grid-cols-1 border-t border-line/15 md:mt-28 md:grid-cols-12 md:gap-x-gutter lg:mt-36"
      >
        {/* Phone: a ruled list, value left / label right. md+: three columns,
            value over label, on the 4 · 4 · 4 grid. */}
        {facts.map((f) => (
          <div
            key={f.k}
            className="flex flex-row-reverse items-baseline justify-between gap-6 border-b border-line/15 py-5 md:col-span-4 md:flex-col-reverse md:items-start md:justify-start md:gap-3 md:border-b-0 md:pb-0 md:pt-8"
          >
            <dt className="label text-muted">{f.label}</dt>
            <dd
              className={cn(
                'font-display text-display-sm font-light text-ink md:text-display-md',
                f.tabular && 'tabular',
              )}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}

/** RU/RO typesetting: a dash never opens a line — tie it to the word before. */
function bindDashes(text: string) {
  return text.replace(/ — /g, ' — ');
}
