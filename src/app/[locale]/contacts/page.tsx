import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { social } from '@/content/site';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ContactInfo } from '@/components/shared/ContactInfo';
import { LeadForm } from '@/components/forms/LeadForm';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'contacts', title: dict.contactsPage.title, description: dict.contactsPage.subtitle });
}

export default function ContactsPage({ params }: { params: { locale: string } }) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero eyebrow={dict.contactsPage.eyebrow} title={dict.contactsPage.title} subtitle={dict.contactsPage.subtitle} />

      <Section tone="default">
        <ContactInfo locale={locale} dict={dict} />
      </Section>

      <Section tone="sand">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <Reveal>
              <h2 className="font-display text-display-md font-semibold text-ink">{dict.contactsPage.formTitle}</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 max-w-md text-lg text-muted">{dict.lead.subtitle}</p>
            </Reveal>
            {social.length > 0 && (
              <Reveal delay={0.1}>
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-label text-brand-700">{dict.contactsPage.social}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {social.map((s) => (
                      <a
                        key={s.name}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand-700"
                      >
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-line/10 bg-white p-6 sm:p-8">
              <LeadForm locale={locale} dict={dict} variant="contact" tone="dark" />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
