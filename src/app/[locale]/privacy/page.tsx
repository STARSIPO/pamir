import type { Metadata } from 'next';
import { isLocale, localeHtmlLang, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { typo } from '@/lib/text';
import { privacySections, privacyUpdated } from '@/content/legal';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return {
    ...buildMetadata({ locale, routeKey: 'privacy', title: dict.privacyPage.title }),
    robots: { index: false, follow: true },
  };
}

/** "1. Общие положения" → ['01', 'Общие положения']; unnumbered headings get their position. */
function splitHeading(heading: string, i: number): [string, string] {
  const m = heading.match(/^\s*(\d+)[.)]\s*(.+)$/);
  const n = m ? Number(m[1]) : i + 1;
  return [String(n).padStart(2, '0'), m ? m[2] : heading];
}

/**
 * "конфиденциальности" / "confidențialitate" are wider than a phone at the
 * display-xl size, and a heading word never breaks on its own. Offer the
 * browser one soft hyphen (U+00AD) in such words — between two consonants,
 * near the middle — so the title wraps as "конфиден-циальности" instead of
 * running off the screen. Invisible whenever the word fits.
 */
const VOWEL = /[aeiouyăâîаеёиоуыэюя]/i;
const LETTER = /\p{L}/u;
const NO_LINE_START = /[ьъй]/i;
function softHyphenate(text: string, minLength = 14) {
  return text.replace(new RegExp(`\\S{${minLength},}`, 'gu'), (word) => {
    const mid = Math.floor(word.length / 2);
    for (let d = 0; d < mid - 3; d++) {
      for (const i of [mid - d, mid + d]) {
        const a = word[i - 1];
        const b = word[i];
        const breakable =
          i > 3 && i < word.length - 3 && LETTER.test(a) && LETTER.test(b) && !VOWEL.test(a) && !VOWEL.test(b) && !NO_LINE_START.test(b);
        if (breakable) {
          return `${word.slice(0, i)}­${word.slice(i)}`;
        }
      }
    }
    return word;
  });
}

/** ISO date → "1 января 2025" / "1 ianuarie 2025". Falls back to the raw value. */
function formatDate(iso: string, locale: Locale) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(localeHtmlLang[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Privacy policy — set for reading. A narrow measure (max-w-prose), numbered
 * sections divided by hairlines, and on wide screens a pinned column with the
 * revision date and an index of the sections.
 */
export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const sections = privacySections.map((s, i) => {
    const [n, title] = splitHeading(s.heading[locale], i);
    return { id: `section-${n}`, n, title, body: s.body };
  });

  return (
    <>
      <PageHero
        eyebrow={dict.privacyPage.eyebrow}
        title={softHyphenate(dict.privacyPage.title)}
        subtitle={dict.design.fill.privacy.lead}
      />

      <Section spacing="none" className="pb-section">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-gutter">
          <aside className="lg:col-span-3">
            <div className="border-t border-line/15 pt-6 lg:sticky lg:top-32">
              <p className="label text-muted">{dict.privacyPage.updated}</p>
              <p className="mt-3 text-base text-ink">
                <time dateTime={privacyUpdated}>{formatDate(privacyUpdated, locale)}</time>
              </p>

              <nav aria-label={dict.privacyPage.title} className="mt-12 hidden lg:block">
                <ol className="space-y-1">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="group flex min-h-9 items-baseline gap-4 py-1.5 text-sm text-muted transition-colors duration-300 hover:text-ink"
                      >
                        <span className="label tabular w-5 shrink-0">{s.n}</span>
                        <span className="link-line pb-0.5">{typo(s.title)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          <div className="border-b border-line/15 lg:col-span-8 lg:col-start-5">
            {sections.map((s) => (
              <Reveal
                as="section"
                key={s.id}
                className="grid scroll-mt-32 gap-y-5 border-t border-line/15 py-10 md:grid-cols-[4.5rem_minmax(0,1fr)] md:py-14"
              >
                <span aria-hidden="true" className="label tabular pt-2 text-muted">
                  {s.n}
                </span>
                <div id={s.id} className="scroll-mt-32">
                  <h2 className="font-display text-display-sm font-light text-balance text-ink">{typo(s.title)}</h2>
                  <div className="mt-5 max-w-prose space-y-4">
                    {s.body.map((p, j) => (
                      <p key={j} className="text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                        {typo(p[locale])}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
