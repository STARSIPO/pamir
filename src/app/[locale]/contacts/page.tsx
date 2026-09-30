import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { contact, social } from '@/content/site';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ArrowLabel } from '@/components/ui/Button';
import { ContactInfo, mapLinks } from '@/components/shared/ContactInfo';
import { LeadForm } from '@/components/forms/LeadForm';
import { splitWords, typo } from '@/lib/text';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  // The H1 already names the company and the root template appends it again,
  // so the document title takes the section name: "Контакты — Pamir Construct".
  return buildMetadata({ locale, routeKey: 'contacts', title: dict.contactsPage.eyebrow, description: dict.contactsPage.subtitle });
}

/**
 * Contacts.
 *
 *   PageHero
 *   ┌ contact rows (phones, office + route, hours, email) ┐  ┌ write to us ──────┐
 *   │ social row                                           │  │ title, lead, form │
 *   └──────────────────────────────────────────────────────┘  └───────────────────┘
 *   ┌ map, wide letterbox ─────────────────────────────────────────────────────────┐
 *   └──────────────────────────────────────────────────────────────────────────────┘
 *
 * No CtaBand: the footer (band) follows directly.
 */
export default async function ContactsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero eyebrow={dict.contactsPage.eyebrow} title={dict.contactsPage.title} subtitle={dict.contactsPage.subtitle} />

      <Section spacing="none" className="pb-section">
        <div className="grid gap-y-20 lg:grid-cols-12 lg:gap-x-gutter">
          {/* Contact rows — the map lives in its own band below. */}
          <Reveal className="lg:col-span-6">
            <ContactInfo locale={locale} dict={dict} withMap={false} />
            {social.length > 0 && (
              <div className="grid gap-x-gutter gap-y-2 border-b border-line/15 py-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-baseline md:py-7">
                <p className="label text-muted">{dict.contactsPage.social}</p>
                <ul className="flex flex-wrap gap-x-8 gap-y-2">
                  {social.map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex min-h-11 items-center text-ink"
                      >
                        <ArrowLabel>{s.name}</ArrowLabel>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>

          {/* Write to us — a raised plane beside the rows. */}
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <div className="bg-surface px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <Reveal stagger>
                <h2 className="font-display text-display-md font-light text-balance text-ink">
                  {splitWords(dict.contactsPage.formTitle)}
                </h2>
              </Reveal>
              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                {typo(dict.lead.subtitle)}
              </p>
              <div className="mt-10">
                <LeadForm locale={locale} dict={dict} variant="contact" tone="dark" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* The map on its own: the address and the route link already sit in
            the office row above, so nothing is repeated under it. */}
        <Reveal className="relative mt-section-sm aspect-[4/3] overflow-hidden bg-canvas-alt md:aspect-[16/9] lg:aspect-[21/8]">
          <iframe
            title={contact.address[locale]}
            src={mapLinks.embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="map-treat absolute inset-0 h-full w-full"
          />
        </Reveal>
      </Section>
    </>
  );
}
