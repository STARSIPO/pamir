import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Media } from '@/components/ui/Media';
import { routes } from '@/i18n/routing';

export function AboutBrief({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="default">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal>
            <span className="eyebrow">{dict.about.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-display-lg font-semibold text-balance">
              {dict.about.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted text-pretty">
              {dict.about.body}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Button href={routes.company(locale)} variant="outline" arrow className="mt-8">
              {dict.about.cta}
            </Button>
          </Reveal>
        </div>

        {/* Asymmetric image composition */}
        <Reveal delay={0.1}>
          <div className="relative">
            <Media
              src={undefined}
              alt={dict.about.title}
              aspect="4 / 5"
              className="rounded-2xl"
              label={locale === 'ru' ? 'Фото объекта' : 'Foto obiect'}
              seed={1}
            />
            <div className="absolute -bottom-8 -left-8 hidden w-2/5 sm:block">
              <Media
                src={undefined}
                alt={dict.about.title}
                aspect="1 / 1"
                className="rounded-2xl border-4 border-white shadow-float"
                label={locale === 'ru' ? 'Деталь' : 'Detaliu'}
                seed={3}
                showTag={false}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
