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
 *   ГРАФИК РАБОТЫ       Пн–Сб: 9:00–18:00 · …
 *
 * `compact` — two columns of label-over-value cells for the lead band, where
 *   the sales number is already shown large: that number is left out.
 *
 *   ─────────────────  ─────────────────
 *   АДМИНИСТРАЦИЯ      БУХГАЛТЕРИЯ
 *   +373 22 54 05 05   +373 22 80 28 03
 *   ─────────────────  ─────────────────
 *   ОФИС               ГРАФИК РАБОТЫ
 *   address, route →   hours
 *
 * `tone`    — 'canvas' (default) or 'band' for the dark contrast band.
 * `withMap` — adds the map beside the rows (wide screens) or under them.
 */
export function ContactInfo({
  locale,
  dict,
  withMap = true,
  tone = 'canvas',
  compact = false,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  withMap?: boolean;
  tone?: 'canvas' | 'band';
  compact?: boolean;
  className?: string;
}) {
  const band = tone === 'band';
  const muted = band ? 'text-band-muted' : 'text-muted';
  const fg = band ? 'text-band-fg' : 'text-ink';
  const rule = band ? 'border-band-fg/15' : 'border-line/15';
  const phones = compact ? contact.phones.filter((p) => p.number !== contact.primaryPhone) : contact.phones;

  const items: { key: string; term: string; value: React.ReactNode }[] = [
    ...phones.map((p) => ({
      key: p.number,
      term: p.label[locale],
      value: (
        <a
          href={telHref(p.number)}
          className={cn('link-line inline-block whitespace-nowrap tabular', !compact && 'font-display text-display-md font-light')}
        >
          {p.number}
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
            className={cn('group inline-flex min-h-11 items-center', compact ? 'mt-1' : 'mt-2')}
          >
            <ArrowLabel>{dict.contactBlock.routeCta}</ArrowLabel>
          </a>
        </>
      ),
    },
    { key: 'hours', term: dict.contactsPage.hoursTitle, value: <span className="text-pretty">{contact.hours[locale]}</span> },
    {
      key: 'email',
      term: dict.form.email,
      value: (
        <a href={`mailto:${contact.email}`} className="link-line inline-block break-all">
          {contact.email}
        </a>
      ),
    },
  ];

  const list = compact ? (
    <dl className="grid gap-x-gutter sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.key} className={cn('border-t pb-8 pt-5', rule)}>
          <dt className={cn('label', muted)}>{it.term}</dt>
          <dd className={cn('mt-3 text-base leading-relaxed', fg)}>{it.value}</dd>
        </div>
      ))}
    </dl>
  ) : (
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
          className="absolute inset-0 h-full w-full grayscale"
        />
      </div>
    </div>
  );
}
