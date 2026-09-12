import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Media } from '@/components/ui/Media';
import { routes } from '@/i18n/routing';

/**
 * The one deliberate measure break on the page: this section runs in a
 * narrower container than the 1360px site default. A single narrowing is what
 * stops a stack of full-width sections reading as a template; repeating it
 * everywhere would just move the problem.
 */
export function AboutBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="sand" containerClassName="lg:max-w-[1120px]">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16">
        <div>
          <SectionHeading
            eyebrow={dict.about.eyebrow}
            title={dict.about.title}
            subtitle={dict.about.body}
          />
          <Reveal delay={0.15}>
            <Button href={routes.company(locale)} variant="outline" arrow className="mt-8">
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>

        {/* Square geometry, no radius, no shadow — the photo is presented as a
            plate, the way an architectural sheet would be. */}
        <Reveal delay={0.1}>
          <figure className="relative bg-white p-5 lg:-mt-24">
            <span aria-hidden="true" className="mb-6 block h-3 w-36 bg-brand" />
            <Media
              src="/photos/about-facade.jpg"
              alt={dict.about.title}
              aspect="3 / 4"
              className="rounded-none"
              sizes="(max-width: 1024px) 100vw, 40vw"
              seed={1}
            />
          </figure>
        </Reveal>
      </div>
    </Section>
  );
}
