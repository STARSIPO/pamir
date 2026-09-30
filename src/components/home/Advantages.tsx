import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { advantages, getStats } from '@/content/home';
import { NBSP, splitWords, typo } from '@/lib/text';

/**
 * 03 — Advantages. Proof first, then reasons.
 *
 *   03 — ПРЕИМУЩЕСТВА ──────────────────────────────────────────────
 *
 *   Опыт, который
 *   можно измерить
 *
 *   │ 4            │ 2            │ 10+*         │ 500+*
 *   │ СДАННЫХ …    │ В СТРОИТ…    │ ЛЕТ НА …     │ КВАРТИР …
 *   * Часть показателей уточняется …
 *
 *   ПОЧЕМУ PAMIR         01 ── Полный цикл …        От проектирования …
 *   Причины              02 ── Контроль качества    Проверяем материалы …
 *   доверять нам         …
 *
 * The figures are light numerals at display size, each on its own vertical
 * hairline, like dimension lines on a drawing. Unconfirmed figures carry an
 * asterisk and the footnote — honesty over impressiveness.
 */
/** Keep one- and two-letter words ("в", "на", "în") on the line of the word
 *  after them, so a narrow label never strands a lone preposition. */
function bindShortWords(text: string) {
  return text.replace(/(^|\s)(\S{1,2})\s+/gu, '$1$2 ');
}

/** Running text: typo() ties the short words and dashes; then a short last
 *  unit ("cu zi.", "день.") is tied to the one before it, so a reason never
 *  ends on a lone word or a split idiom ("viața de zi / cu zi."). Only a plain
 *  space breaks, so the lookup skips the no-break spaces typo() put in. */
function setReason(text: string) {
  return typo(text).replace(/ ([^ ]{1,8})$/u, `${NBSP}$1`);
}

export function Advantages({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const stats = getStats();
  const hasPlaceholders = stats.some((s) => s.placeholder);

  return (
    <Section tone="canvas" id="advantages">
      <SectionHeading index="03" eyebrow={dict.design.numbersEyebrow} title={dict.stats.title} />

      {/* Figures. <dt> comes first in the DOM (label, then value) for screen
          readers; flex-col-reverse puts the numeral on top visually.
          The gutter gap puts each hairline on the page grid: at lg every cell
          spans 3 of 12 columns (lines on cols 1/4/7/10), at md the lines meet
          the reasons list's 8 columns, and on phones they match the 2-column
          lists further down. Below 360 px a two-up cell is too narrow for
          «В строительстве», so the figures stack in one column there. */}
      <dl className="mt-16 grid grid-cols-1 gap-x-gutter gap-y-14 min-[360px]:grid-cols-2 md:mt-24 md:grid-cols-4 lg:mt-28">
        {stats.map((s, i) => (
          <Reveal
            key={s.label.ru}
            delay={i * 0.08}
            className="flex flex-col-reverse justify-end border-l border-line/15 pb-1 pl-3 pr-0 sm:pl-6 sm:pr-3 lg:pl-8"
          >
            <dt className="label mt-5 text-muted max-sm:tracking-[0.1em] md:mt-7">{bindShortWords(s.label[locale])}</dt>
            <dd className="font-display text-display-xl font-light text-ink">
              <Counter value={s.value} suffix={s.suffix} locale={locale} />
              {s.placeholder && (
                <span className="ml-0.5 inline-block align-top text-lead leading-none text-muted">*</span>
              )}
            </dd>
          </Reveal>
        ))}
      </dl>

      {hasPlaceholders && (
        <Reveal delay={0.2}>
          <p className="mt-10 max-w-xl text-pretty text-sm leading-relaxed text-muted md:mt-12">{typo(dict.stats.note)}</p>
        </Reveal>
      )}

      {/* Reasons: an editorial list on the 12-column grid. */}
      <div className="mt-section grid gap-12 lg:grid-cols-12 lg:gap-gutter">
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <Reveal className="label text-muted">{dict.why.eyebrow}</Reveal>
          <Reveal stagger className="mt-6 md:mt-8">
            <h3 className="font-display text-display-lg font-light text-balance text-ink lg:max-w-[12ch]">
              {splitWords(dict.why.title)}
            </h3>
          </Reveal>
        </div>

        <ol className="lg:col-span-8">
          {advantages.map((a, i) => (
            <Reveal
              as="li"
              key={a.n}
              delay={i * 0.08}
              className="relative grid gap-x-gutter gap-y-4 border-t border-line/15 pb-10 pt-6 last:pb-0 md:grid-cols-8 md:pb-12 md:pt-8"
            >
              {/* A short accent segment on the rule marks each reason. */}
              <span aria-hidden="true" className="absolute -top-px left-0 h-px w-10 bg-accent" />
              <span className="label tabular text-muted md:col-span-1 md:pt-2">{a.n}</span>
              <h4 className="font-display text-display-sm font-light text-balance text-ink md:col-span-3 md:pr-6">
                {typo(a.title[locale])}
              </h4>
              <p className="max-w-[40ch] text-pretty text-base leading-relaxed text-muted md:col-span-4 md:pt-1 md:text-[1.0625rem]">
                {setReason(a.text[locale])}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
