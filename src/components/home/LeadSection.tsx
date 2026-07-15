import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { LeadForm } from '@/components/forms/LeadForm';
import { contact } from '@/content/site';
import { telHref } from '@/lib/utils';
import { Phone } from 'lucide-react';

export function LeadSection({
  locale,
  dict,
  projectName,
  id = 'lead',
}: {
  locale: Locale;
  dict: Dictionary;
  projectName?: string;
  id?: string;
}) {
  return (
    <Section id={id} tone="dark">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="lg:pt-4">
          <Reveal>
            <span className="eyebrow">{dict.lead.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-display-lg font-semibold text-white text-balance">
              {dict.lead.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
              {dict.lead.subtitle}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <a
              href={telHref(contact.primaryPhone)}
              className="mt-8 inline-flex items-center gap-3 text-2xl font-bold text-white transition-colors hover:text-brand"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
                <Phone className="h-5 w-5" />
              </span>
              {contact.primaryPhone}
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <LeadForm locale={locale} dict={dict} variant="lead" tone="light" projectName={projectName} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
