import { Phone } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { contact } from '@/content/site';
import { routes } from '@/i18n/routing';
import { telHref } from '@/lib/utils';

/** Compact conversion band for page bottoms. */
export function CtaBand({
  locale,
  dict,
  title,
  subtitle,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  subtitle?: string;
}) {
  return (
    <Section tone="dark">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <Reveal>
            <h2 className="font-display text-display-md font-semibold text-white text-balance">
              {title}
            </h2>
          </Reveal>
          {subtitle && (
            <Reveal delay={0.05}>
              <p className="mt-4 text-lg text-white/65">{subtitle}</p>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={telHref(contact.primaryPhone)} variant="primary" size="lg">
              <Phone className="h-4 w-4" />
              {contact.primaryPhone}
            </Button>
            <Button href={routes.contacts(locale)} variant="outlineLight" size="lg" arrow>
              {dict.common.getConsultation}
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
