import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Apartment } from '@/lib/inventory/types';
import { formatArea, formatEUR, pricing } from '@/lib/pricing/engine';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import { ApartmentStatus } from './ApartmentStatus';
import { fill } from './text';

/** Id of the price plate + actions (the phone summary bar takes over once they scroll away). */
export const PRICE_ID = 'apartment-price';

/**
 * Right column of the apartment page — the card a buyer reads:
 *
 *   ■ ДОСТУПНА                               УГЛОВАЯ
 *   ─────────────────────────────────────────────────
 *   КОМНАТЫ          │ ПЛОЩАДЬ
 *   3                │ 84,6 м²
 *   ЭТАЖ             │ КОРПУС
 *   7 из 10          │ Блок 3
 *   БАЛКОН           │ САНУЗЛЫ
 *   4,8 м²           │ 2
 *   ┌ — СТОИМОСТЬ КВАРТИРЫ ───────────────────────────┐
 *   │ €122 670                                        │
 *   │ Цена за м²                              €1 450  │
 *   │ Включая балкон 4,8 м² по 50% от цены м²         │
 *   │ цены ориентировочные…                           │
 *   └─────────────────────────────────────────────────┘
 *   {actions: lead bar, calculate, download}
 *   [Угловая квартира] [Окна во двор] [Два санузла]
 *   {after: status note, similar apartments}
 *
 * Every figure of the apartment first, then the price, then the actions —
 * the order the brief lists them in. Server component; the buttons are the
 * `actions` island. A sold apartment shows no price and offers only the
 * download — its card ends on the status note and the alternatives.
 *
 * The total is set exactly like the calculator's «Итого» (full-size
 * formatEUR), so the two hero prices of the page read as one.
 */
export function ApartmentFacts({
  apartment,
  locale,
  dict,
  buildingName,
  floorsCount,
  showPriceNote,
  actions,
  after,
  className,
}: {
  apartment: Apartment;
  locale: Locale;
  dict: Dictionary;
  buildingName: string;
  floorsCount: number;
  showPriceNote: boolean;
  actions: React.ReactNode;
  after?: React.ReactNode;
  className?: string;
}) {
  const c = dict.inventory.common;
  const t = dict.inventory.apartment;
  const sold = apartment.status === 'sold';
  const outdoorArea = `${formatArea(apartment.balconyArea, locale)} ${c.sqm}`;

  const figures: { label: string; value: string; unit?: string }[] = [
    { label: t.facts.rooms, value: String(apartment.rooms) },
    { label: t.facts.area, value: formatArea(apartment.area, locale), unit: c.sqm },
    { label: t.facts.floor, value: String(apartment.floor), unit: fill(t.facts.floorOf, { n: floorsCount }) },
    { label: t.facts.building, value: buildingName },
    ...(apartment.outdoor !== 'none'
      ? [{ label: c.outdoor[apartment.outdoor], value: formatArea(apartment.balconyArea, locale), unit: c.sqm }]
      : []),
    { label: t.facts.bathrooms, value: String(apartment.bathrooms) },
  ];

  // Why the total is more than area × price per m²: the balcony or terrace
  // is priced in at its share of the m² price (pricing.json → outdoorShare).
  // Said only when the numbers really add up that way — a CRM price may not.
  const share = apartment.outdoor !== 'none' ? pricing.projects[apartment.projectSlug]?.outdoorShare[apartment.outdoor] : 0;
  const outdoorNote =
    apartment.outdoor !== 'none' &&
    share &&
    Math.abs(apartment.totalPrice - (apartment.area + apartment.balconyArea * share) * apartment.pricePerSqm) <=
      pricing.roundTo / 2 + 1
      ? fill(t.facts.outdoorIncluded[apartment.outdoor], { area: outdoorArea, share: Math.round(share * 100) })
      : null;

  // Ruled off by the row above it: the last action's hairline, or (sold) the figures'.
  const chips = apartment.features.length > 0 && (
    <div className="border-b border-line/15 py-5">
      <h3 className="sr-only">{t.facts.features}</h3>
      <ul className="flex flex-wrap gap-2">
        {apartment.features.map((f) => (
          <li key={f} className="border border-line/15 px-3 py-1.5 text-sm text-muted">
            {c.features[f]}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <aside aria-labelledby="apartment-facts-title" className={className}>
      <h2 id="apartment-facts-title" className="sr-only">
        {t.facts.title}
      </h2>

      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-line/15 pb-4">
        <ApartmentStatus status={apartment.status} label={c.status[apartment.status]} />
        <span className="label text-muted">{c.type[apartment.type]}</span>
      </div>

      {/* Every figure, large, two to a row. */}
      <dl className="grid grid-cols-2 border-b border-line/15">
        {figures.map((f, i) => (
          <Figure
            key={f.label}
            {...f}
            top={i >= 2}
            right={i % 2 === 1}
            wide={i === figures.length - 1 && figures.length % 2 === 1}
          />
        ))}
      </dl>

      {/* The price, then the actions right under it. */}
      {!sold && (
        <div id={PRICE_ID}>
          <div className="mt-8 border border-line/15 bg-surface px-6 pb-6 pt-5 md:px-7">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-6 bg-accent" />
              <p className="label text-muted">{t.facts.total}</p>
            </div>
            <p className="mt-4 font-display text-display-lg font-light tabular text-ink">
              {formatEUR(apartment.totalPrice, locale)}
            </p>
            <dl className="mt-4 flex items-baseline justify-between gap-6 border-t border-line/15 pt-4">
              <dt className="text-sm text-muted">{t.facts.pricePerSqm}</dt>
              <dd className="text-base tabular text-ink">{formatEUR(apartment.pricePerSqm, locale)}</dd>
            </dl>
            {outdoorNote && <p className="mt-1.5 text-pretty text-sm leading-snug text-muted">{typo(outdoorNote)}</p>}
            {showPriceNote && <p className="mt-4 text-pretty text-xs leading-relaxed text-muted">{typo(c.priceNote)}</p>}
          </div>
          <div className="mt-3">{actions}</div>
        </div>
      )}

      {chips}

      {sold && <div className="mt-6">{actions}</div>}
      {after}
    </aside>
  );
}

function Figure({
  label,
  value,
  unit,
  top,
  right,
  wide,
}: {
  label: string;
  value: string;
  unit?: string;
  top?: boolean;
  right?: boolean;
  /** The odd last figure spans the row. */
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        'py-5',
        top && 'border-t border-line/15',
        right && 'border-l border-line/15 pl-5 md:pl-6',
        wide && 'col-span-2',
      )}
    >
      <dt className="label text-muted">{label}</dt>
      <dd className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-display-md font-light tabular text-ink">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </dd>
    </div>
  );
}
