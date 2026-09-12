import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { getStats } from '@/content/home';

/**
 * Runs directly under WhyUs on the same graphite ground (`pt-0` there, `pb-0`
 * here) so the two read as one continuous proof band rather than two stacked
 * dark sections.
 */
export function Stats({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const stats = getStats();
  const hasPlaceholders = stats.some((s) => s.placeholder);

  return (
    <Section tone="graphite" className="pt-14 sm:pt-16 lg:pt-20">
      <div className="mb-14 max-w-2xl">
        <SectionHeading eyebrow={dict.stats.eyebrow} title={dict.stats.title} tone="light" />
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="border-t border-white/15 pt-5">
              {/* The number is the headline — the label is demoted under it. */}
              <div className="font-display text-6xl font-bold leading-none text-white sm:text-7xl">
                <Counter value={s.value} suffix={s.suffix} locale={locale} />
              </div>
              <p className="mt-4 text-xs uppercase tracking-label text-white/50">
                {s.label[locale]}
                {s.placeholder && <span className="text-brand"> *</span>}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {hasPlaceholders && <p className="mt-10 text-xs text-white/35">{dict.stats.note}</p>}
    </Section>
  );
}
