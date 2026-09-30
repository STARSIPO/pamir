import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Apartment } from '@/lib/inventory/types';
import { formatArea, formatEUR } from '@/lib/pricing/engine';
import { typo } from '@/lib/text';
import { Arrow } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { StatusMark } from './ApartmentStatus';
import { fill } from './text';

/**
 * For a reserved or sold apartment: a short status note, then up to three
 * available alternatives (same building first, nearest in rooms, area and
 * floor) and the ways back into the selector.
 *
 *   Эта квартира продана. Ниже — похожие…
 *   ПОХОЖИЕ ДОСТУПНЫЕ КВАРТИРЫ
 *   ■ №35                                               €125 400 →
 *     3 комнаты · 84,6 м² · этаж 8
 *   ■ №10                                               €118 900 →
 *     3 комнаты · 83,9 м² · этаж 3 · Блок 4       ← another building is named
 *   Все квартиры этажа 7 →        Выбрать этаж — Блок 3 →
 *
 * Numbers restart in every building, so a flat from another building says
 * which. The details sit on their own line under the number, never cut.
 */
export function SimilarApartments({
  note,
  items,
  hrefOf,
  locale,
  labels,
  roomsLabel,
  buildingId,
  buildingName,
  links,
  className,
}: {
  note: string;
  items: Apartment[];
  hrefOf: Record<string, string>;
  locale: Locale;
  /** `number`: «№{n}»; `item`: «{rooms} · {area} м² · этаж {floor}». */
  labels: { title: string; number: string; item: string; none: string };
  roomsLabel: Record<number, string>;
  /** The page's own building: others are named in the row. */
  buildingId: string;
  /** Building id → name. */
  buildingName: Record<string, string>;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn('mt-10', className)}>
      <p className="border-l border-accent/60 pl-4 text-pretty text-sm leading-relaxed text-muted">{typo(note)}</p>

      <h3 className="label mt-10 text-muted">{labels.title}</h3>
      {items.length > 0 ? (
        <ul className="mt-4 border-b border-line/15">
          {items.map((a) => {
            const meta = fill(labels.item, {
              rooms: roomsLabel[a.rooms] ?? String(a.rooms),
              area: formatArea(a.area, locale),
              floor: a.floor,
            });
            const other = a.buildingId !== buildingId ? buildingName[a.buildingId] : undefined;
            return (
              <li key={a.id} className="border-t border-line/15">
                <Link
                  href={hrefOf[a.id]}
                  className="group flex min-h-16 items-center justify-between gap-4 py-3.5 transition-colors duration-500"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-3">
                      <StatusMark status={a.status} />
                      <span className="font-display text-display-sm font-light tabular text-ink">
                        {fill(labels.number, { n: a.number })}
                      </span>
                    </span>
                    {/* Under the number, aligned with it past the mark (8 px + 12 px gap). */}
                    <span className="pl-5 text-pretty text-sm leading-snug text-muted">
                      {typo(other ? `${meta} · ${other}` : meta)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-base tabular text-ink">{formatEUR(a.totalPrice, locale)}</span>
                    <Arrow className="w-5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">{typo(labels.none)}</p>
      )}

      <div className="mt-6 flex flex-col items-start gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group inline-flex min-h-11 items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink"
          >
            <span className="link-rule pb-1">{l.label}</span>
            <Arrow />
          </Link>
        ))}
      </div>
    </div>
  );
}
