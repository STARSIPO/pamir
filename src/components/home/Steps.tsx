import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { steps } from '@/content/home';
import { splitWords } from '@/lib/text';

/**
 * The path from choosing a home to the keys — the second half of chapter 05.
 *
 * A calm process row: six columns on wide screens, 3 × 2 on tablets, a list
 * on phones. Every step stands on a 1px rule; the numeral is the only accent.
 *
 *   ───────────  ───────────  ───────────  ───────────  ───────────  ───────────
 *   01           02           03           04           05           06
 *
 *   Выбор        Консульта-   Выбор        Способ       Оформление   Получение
 *   комплекса    ция          квартиры     оплаты                    ключей
 *   text         text         text         text         text         text
 */
export function Steps({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="canvas" spacing="sm" aria-labelledby="steps-title">
      {/* Same opener as SectionHeading (label + drawn rule, word-by-word
          title), with the measure set on the heading itself so `ch` is
          taken at display size. */}
      <div className="flex items-center gap-4">
        <Reveal className="label shrink-0 text-muted">{dict.steps.eyebrow}</Reveal>
        <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
      </div>
      <Reveal stagger className="mt-8 md:mt-12">
        <h2 id="steps-title" className="max-w-[14ch] font-display text-display-lg font-light text-balance text-ink">
          {splitWords(dict.steps.title)}
        </h2>
      </Reveal>

      <ol className="mt-12 grid border-b border-line/15 md:mt-20 md:grid-cols-3 md:gap-x-gutter md:gap-y-16 md:border-b-0 xl:grid-cols-6">
        {steps.map((s, i) => (
          <Reveal
            as="li"
            key={s.n}
            delay={(i % 6) * 0.08}
            className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-line/15 py-7 sm:grid-cols-[5rem_minmax(0,1fr)] md:block md:py-0 md:pt-7"
          >
            <span aria-hidden="true" className="font-display text-display-md font-light tabular text-accent">
              {s.n}
            </span>
            <div className="md:mt-12 xl:mt-16">
              {/* Two title lines reserved in the six-up row, so every
                  description starts on one line whether its title wraps
                  ("Получение / ключей") or not. */}
              <h3 className="font-display text-display-sm font-light text-balance text-ink xl:min-h-[2lh]">
                {s.title[locale]}
              </h3>
              <p className="mt-3 max-w-[34ch] text-pretty text-base leading-relaxed text-muted md:mt-4">
                {s.text[locale]}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
