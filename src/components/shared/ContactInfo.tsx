import { MapPin, Clock, Mail, Navigation } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { contact } from '@/content/site';
import { telHref } from '@/lib/utils';

/** Reusable contacts block + Google Map embed (used on Home & Contacts). */
export function ContactInfo({
  locale,
  dict,
  withMap = true,
}: {
  locale: Locale;
  dict: Dictionary;
  withMap?: boolean;
}) {
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&z=16&output=embed`;
  const mapDir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.mapQuery)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-label text-brand-700">
            {dict.contactsPage.phonesTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            {contact.phones.map((p) => (
              <li key={p.number} className="flex items-baseline justify-between gap-4 border-b border-line/10 pb-3">
                <span className="text-sm text-muted">{p.label[locale]}</span>
                <a href={telHref(p.number)} className="font-display text-lg font-semibold text-ink transition-colors hover:text-brand-700">
                  {p.number}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-label text-brand-700">
              {dict.contactsPage.officeTitle}
            </h3>
            <p className="mt-3 flex items-start gap-2.5 text-ink">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              {contact.address[locale]}
            </p>
            <a href={`mailto:${contact.email}`} className="mt-3 flex items-center gap-2.5 text-muted transition-colors hover:text-brand-700">
              <Mail className="h-5 w-5 shrink-0 text-brand" />
              {contact.email}
            </a>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-label text-brand-700">
              {dict.contactsPage.hoursTitle}
            </h3>
            <p className="mt-3 flex items-start gap-2.5 text-ink">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              {contact.hours[locale]}
            </p>
          </div>
        </div>

        <a
          href={mapDir}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink link-underline"
        >
          <Navigation className="h-4 w-4 text-brand" />
          {dict.contactBlock.routeCta}
        </a>
      </div>

      {withMap && (
        <div className="overflow-hidden rounded-2xl border border-line/10" style={{ aspectRatio: '4 / 3' }}>
          <iframe
            title={contact.address[locale]}
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
