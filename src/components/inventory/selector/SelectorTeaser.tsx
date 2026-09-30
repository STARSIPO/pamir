import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { getInventory, stats } from '@/lib/inventory/repository';
import type { ProjectInventory } from '@/lib/inventory/types';
import { pricing } from '@/lib/pricing/engine';
import { cn } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { formatEUR } from '../format';
import { TeaserScheme } from './TeaserScheme';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Project-page entry into the apartment selector ("Выбор квартиры").
 *
 *   Выберите квартиру                 ┌──────────────────────────────┐
 *   на интерактивной схеме            │   axonometric scheme of the   │
 *   short text                        │   complex (a picture; rises   │
 *   01 Корпус — 02 Этаж — 03 Квартира │   on first view)              │
 *   65 in stock   от €64 700          │                               │
 *   2 buildings   1–4 rooms           └──────────────────────────────┘
 *   [ ВЫБРАТЬ КВАРТИРУ → ]
 *
 * Section content only — the page wraps it in its Section and label row, so
 * the headline is an h3. Renders nothing for a project without inventory.
 */
export function SelectorTeaser({
  locale,
  dict,
  projectSlug,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  projectSlug: string;
  className?: string;
}) {
  const inventory = getInventory(projectSlug);
  if (!inventory) return null;

  const common = dict.inventory.common;
  const t = dict.inventory.selector;
  const total = stats(inventory.apartments);
  const href = routes.selector(locale, projectSlug);
  const rooms = total.rooms.length
    ? `${total.rooms.length > 1 ? `${total.rooms[0]}–${total.rooms[total.rooms.length - 1]}` : total.rooms[0]} ${common.roomsShort}`
    : '—';

  // The picture needs the site and the buildings only.
  const scheme: ProjectInventory = { ...inventory, apartments: [], plates: [] };
  const labels = {
    scheme: t.schemeLabel,
    north: t.north,
    features: t.features,
    street: inventory.site.street?.[locale],
    names: Object.fromEntries(inventory.buildings.map((b) => [b.id, b.name[locale]])),
  };

  const facts = [
    { label: t.teaser.available, value: String(total.available) },
    { label: t.teaser.price, value: total.priceFrom !== null ? `${common.from} ${formatEUR(total.priceFrom, locale)}` : '—' },
    { label: t.teaser.buildings, value: String(inventory.buildings.length) },
    { label: t.teaser.rooms, value: rooms },
  ];
  const steps = [common.steps.building, common.steps.floor, common.steps.apartment];

  return (
    <div className={cn('grid gap-14 lg:grid-cols-12 lg:gap-gutter', className)}>
      <div className="flex flex-col lg:col-span-5 lg:row-start-1">
        {inventory.demo && (
          // Muted text (AA on every theme); the accent square is the mark.
          <Reveal className="label flex items-center gap-2.5 text-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
            {common.demoBadge}
          </Reveal>
        )}
        <Reveal stagger className={cn(inventory.demo && 'mt-6')}>
          <h3 className="font-display text-display-lg font-light text-balance text-ink">
            {splitWords(t.teaser.title)}
          </h3>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-[44ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
            {typo(t.teaser.text)}
          </p>
          <ol className="label mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-muted sm:gap-x-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2.5 sm:gap-3">
                <span className="tabular text-ink">{pad(i + 1)}</span>
                <span>{s}</span>
                {i < steps.length - 1 && <span aria-hidden="true" className="hidden h-px w-8 bg-line/20 sm:block" />}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.12}>
          <dl className="mt-10 grid grid-cols-2 gap-x-gutter md:mt-12">
            {facts.map((f) => (
              <div key={f.label} className="border-t border-line/15 pb-6 pt-4">
                <dt className="label text-muted">{f.label}</dt>
                <dd className="mt-3 font-display text-display-sm font-light tabular text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col items-start gap-4">
            <Button href={href} size="lg" arrow className="w-full sm:w-auto">
              {common.cta}
            </Button>
            {pricing.demo && <p className="max-w-[44ch] text-pretty text-sm leading-relaxed text-muted">{typo(common.priceNote)}</p>}
          </div>
        </Reveal>
      </div>

      {/* The picture is a second way in; the button above is the accessible one. */}
      <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-center">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="group block border border-line/15 px-4 pb-6 pt-12 transition-colors duration-500 ease-premium hover:border-line/35 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10 lg:pt-14"
        >
          <TeaserScheme inventory={scheme} labels={labels} idPrefix={`cx-teaser-${projectSlug}`} />
        </Link>
      </Reveal>
    </div>
  );
}
