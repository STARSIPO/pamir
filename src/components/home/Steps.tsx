import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { steps } from '@/content/home';

export function Steps({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="default">
      <SectionHeading eyebrow={dict.steps.eyebrow} title={dict.steps.title} />

      <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={(i % 3) * 0.08}>
            <li className="relative">
              <span className="font-display text-5xl font-bold text-stone">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title[locale]}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.text[locale]}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
