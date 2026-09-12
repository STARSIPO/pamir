import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { advantages } from '@/content/home';

export function WhyUs({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="graphite" className="pb-0">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading eyebrow={dict.why.eyebrow} title={dict.why.title} tone="light" />
          <Reveal delay={0.1}>
            <div className="mt-10 hidden lg:block">
              <Media
                src="/photos/interior-living.jpg"
                alt={dict.why.title}
                aspect="4 / 3"
                className="rounded-none"
                sizes="(max-width: 1024px) 100vw, 40vw"
                seed={2}
              />
            </div>
          </Reveal>
        </div>

        <ul className="flex flex-col">
          {advantages.map((a, i) => (
            <Reveal key={a.n} delay={i * 0.08}>
              <li className="flex gap-6 border-t border-white/12 py-7 first:border-t-0 first:pt-0">
                <span className="font-display text-2xl font-bold text-brand">{a.n}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">{a.title[locale]}</h3>
                  <p className="mt-2 leading-relaxed text-white/60">{a.text[locale]}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
