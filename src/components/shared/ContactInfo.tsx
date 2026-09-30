import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { contact } from '@/content/site';
import { cn, telHref } from '@/lib/utils';
import { ArrowLabel } from '@/components/ui/Button';

/** Google Maps links built from the one address source (content/site.ts). */
export const mapLinks = {
  embed: `https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&z=16&output=embed`,
  route: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.mapQuery)}`,
};

/**
 * Contact details as label / value pairs on 1px rules — a legend sheet, not a
 * card. No icons: the labels carry the meaning.
 *
 * Default — rows, with every phone number at display size:
 *
 *   ОТДЕЛ ПРОДАЖ        +373 76 007 007
 *   ─────────────────────────────────────────
 *   ОФИС                Кишинёв, ул. Дечебал 139/5
 *                       ПОСТРОИТЬ МАРШРУТ ──→
 *   ─────────────────────────────────────────
 *   ГРАФИК РАБОТЫ       Пн–Сб: 9:00–18:00
 *                       Вс: выходной
 *
 * Phone and email links are at least 44px tall (the phone is the main action
 * on a phone); the underline stays on the text inside.
 *
 * `tone`    — 'canvas' (default) or 'band' for the dark contrast band.
 * `withMap` — adds the map beside the rows (wide screens) or under them.
 */
export function ContactInfo({
  locale,
  dict,
  withMap = true,
  tone = 'canvas',
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  withMap?: boolean;
  tone?: 'canvas' | 'band';
  className?: string;
}) {
  const band = tone === 'band';
  const muted = band ? 'text-band-muted' : 'text-muted';
  const fg = band ? 'text-band-fg' : 'text-ink';
  const rule = band ? 'border-band-fg/15' : 'border-line/15';

  const items: { key: string; term: string; value: React.ReactNode }[] = [
    ...contact.phones.map((p) => ({
      key: p.number,
      term: p.label[locale],
      value: (
        <a
          href={telHref(p.number)}
          className="group inline-flex min-h-11 items-center whitespace-nowrap font-display text-display-md font-light tabular"
        >
          <span className="link-line">{p.number}</span>
        </a>
      ),
    })),
    {
      key: 'office',
      term: dict.contactsPage.officeTitle,
      value: (
        <>
          <span className="block text-pretty">{contact.address[locale]}</span>
          <a
            href={mapLinks.route}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 inline-flex min-h-11 items-center"
          >
            <ArrowLabel>{dict.contactBlock.routeCta}</ArrowLabel>
          </a>
        </>
      ),
    },
    {
      key: 'hours',
      term: dict.contactsPage.hoursTitle,
      // "Пн–Сб: 9:00–18:00 · Вс: выходной" — one schedule per line, as in the
      // footer, so a day never ends a line with its hours on the next.
      value: contact.hours[locale].split(' · ').map((part) => (
        <span key={part} className="block">
          {part}
        </span>
      )),
    },
    {
      key: 'email',
      term: dict.form.email,
      value: (
        <a href={`mailto:${contact.email}`} className="group inline-flex min-h-11 max-w-full items-center">
          <span className="link-line min-w-0 break-all">{contact.email}</span>
        </a>
      ),
    },
  ];

  const list = (
    <dl className={cn('border-b', rule)}>
      {items.map((it) => (
        <div
          key={it.key}
          className={cn(
            'grid gap-x-gutter gap-y-2 border-t py-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-baseline md:py-7',
            rule,
          )}
        >
          <dt className={cn('label', muted)}>{it.term}</dt>
          <dd className={cn('text-lead', fg)}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );

  if (!withMap) return <div className={className}>{list}</div>;

  return (
    <div className={cn('grid gap-y-14 lg:grid-cols-12 lg:gap-x-gutter', className)}>
      <div className="lg:col-span-7">{list}</div>
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas-alt lg:col-span-4 lg:col-start-9 lg:aspect-[4/5]">
        <iframe
          title={contact.address[locale]}
          src={mapLinks.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          // Theme-aware treatment (grey in light themes, inverted in dark).
          className="map-treat absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
