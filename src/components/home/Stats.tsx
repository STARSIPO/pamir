import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { getStats } from '@/content/home';

export function Stats({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const stats = getStats();
  const hasPlaceholders = stats.some((s) => s.placeholder);

  return (
    <Section tone="graphite">
      <div className="mb-14 max-w-2xl">
        <Reveal>
          <span className="eyebrow">{dict.stats.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 font-display text-display-lg font-semibold text-white text-balance">
            {dict.stats.title}
          </h2>
        </Reveal>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="border-t border-white/15 pt-5">
              <div className="font-display text-5xl font-bold text-white sm:text-6xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-3 text-sm text-white/55">
                {s.label[locale]}
                {s.placeholder && <span className="text-brand"> *</span>}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {hasPlaceholders && (
        <p className="mt-10 text-xs text-white/35">{dict.stats.note}</p>
      )}
    </Section>
  );
}
