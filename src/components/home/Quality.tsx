import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { qualityFeatures } from '@/content/home';

export function Quality({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="sand">
      <SectionHeading
        eyebrow={dict.quality.eyebrow}
        title={dict.quality.title}
        subtitle={dict.quality.subtitle}
      />

      <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 lg:grid-cols-4">
        {qualityFeatures.map((f, i) => (
          <Reveal key={f.icon + i} delay={(i % 4) * 0.06}>
            <div className="flex h-full flex-col gap-4 bg-sand p-6 transition-colors hover:bg-white sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/12 text-brand-700">
                <FeatureIcon name={f.icon} />
              </span>
              <span className="text-[0.95rem] font-medium leading-snug text-ink">{f.label[locale]}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
