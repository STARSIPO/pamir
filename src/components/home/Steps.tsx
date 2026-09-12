import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { steps } from '@/content/home';

export function Steps({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="default">
      {/*
        Pinned process section: on large screens the heading column sticks
        while the steps scroll past it. Native `position: sticky` — no pinning
        library, no pin-spacer DOM, nothing to refresh on route change.
      */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionHeading eyebrow={dict.steps.eyebrow} title={dict.steps.title} />
          </div>
        </div>

        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-8 lg:mt-0 lg:grid-cols-1 lg:gap-y-14">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 0.08}>
              <li className="relative border-t border-line/12 pt-6 lg:flex lg:gap-8">
                <span className="font-display text-5xl font-bold text-stone lg:w-24 lg:shrink-0 lg:text-6xl">
                  {s.n}
                </span>
                <div className="lg:flex-1">
                  <h3 className="mt-3 font-display text-xl font-semibold text-ink lg:mt-0">
                    {s.title[locale]}
                  </h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-muted">{s.text[locale]}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
