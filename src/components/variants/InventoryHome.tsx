import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Counter';
import { Button } from '@/components/ui/Button';
import {
  InventoryTool,
  type ToolFloor,
  type ToolLabels,
  type ToolRow,
  type ToolUnit,
  type UnitStatus,
} from './InventoryTool';
import { DEMO_DATA_NOTICE, demoBlock, demoCounts, type DemoUnit } from '@/content/demo-inventory';
import { projects } from '@/content/projects';
import { contact } from '@/content/site';
import { routes } from '@/i18n/routing';
import { splitWords } from '@/lib/text';
import { cn, telHref } from '@/lib/utils';

/**
 * DIRECTION 03 — "Инвентарь".
 *
 * The homepage stops being a brochure and becomes a unit-picking tool: the
 * first screen is a schematic elevation of one block, drawn entirely from the
 * unit list, with every apartment's sales status on it. It answers the only
 * question a buyer actually arrives with — what is free and what does it cost —
 * and it needs no photography at all, which is the argument for the direction.
 *
 * The data behind it is FABRICATED (see src/content/demo-inventory.ts). That is
 * why DEMO_DATA_NOTICE is rendered above the tool rather than buried in a
 * footnote: this page is a decision aid for the client, not stock for a buyer.
 *
 * Everything on this page is a Server Component except InventoryTool, which
 * receives values already localized and already run through Intl here.
 */
export function InventoryHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pd = dict.projectDetail;
  const num = new Intl.NumberFormat(locale);

  const statusLabels: Record<UnitStatus, string> = {
    available: pd.available,
    reserved: pd.reserved,
    sold: pd.sold,
    unknown: pd.statusUnknown,
  };

  // Short functional words only — no new marketing copy is written here.
  const w = {
    apt: locale === 'ru' ? 'кв.' : 'ap.',
    commercial: locale === 'ru' ? 'Коммерция' : 'Comerț',
    legend: locale === 'ru' ? 'Обозначения' : 'Legendă',
    all: locale === 'ru' ? 'Все' : 'Toate',
    selection: locale === 'ru' ? 'Выбрано' : 'Selectat',
    summary: locale === 'ru' ? 'Блок' : 'Blocul',
    rooms: locale === 'ru' ? 'Комнаты' : 'Camere',
    living: locale === 'ru' ? 'Жилая' : 'Locuibilă',
    orientation: locale === 'ru' ? 'Ориентация' : 'Orientare',
    price: locale === 'ru' ? 'Цена' : 'Preț',
    total: locale === 'ru' ? 'Всего' : 'Total',
    floors: locale === 'ru' ? 'Этажей' : 'Etaje',
    free: locale === 'ru' ? 'свободно' : 'libere',
  };

  const residential = demoBlock.units.filter((u) => u.rooms > 0);
  const counts = demoCounts(demoBlock);

  // Columns of the elevation. One weight per position, taken from the widest
  // unit in that column, so the grid stays aligned floor to floor AND a 3-room
  // reads visibly wider than a 1-room.
  const positions = Array.from(new Set(residential.map((u) => u.position))).sort((a, b) => a - b);
  const columns = positions.map((p) =>
    Math.max(...residential.filter((u) => u.position === p).map((u) => u.areaTotal)),
  );

  const area = (v: number) => `${num.format(v)} ${pd.sqm}`;

  const toUnit = (u: DemoUnit): ToolUnit => ({
    id: u.id,
    floor: u.floor,
    rooms: u.rooms,
    status: u.status,
    // "кв. 74, этаж 7, 2 комн., 58 м², Доступна"
    name: [
      `${w.apt} ${u.number}`,
      `${pd.floor.toLowerCase()} ${u.floor}`,
      `${u.rooms} ${pd.rooms}`,
      area(u.areaTotal),
      statusLabels[u.status],
    ].join(', '),
    numberLabel: `${w.apt} ${num.format(u.number)}`,
    floorLabel: `${pd.floor} ${num.format(u.floor)}`,
    roomsLabel: `${num.format(u.rooms)} ${pd.rooms}`,
    areaTotal: area(u.areaTotal),
    areaLiving: area(u.areaLiving),
    orientation: u.orientation[locale],
    statusLabel: statusLabels[u.status],
    price: u.price ? `${num.format(u.price)} €` : '—',
  });

  const floorNumbers = Array.from(new Set(residential.map((u) => u.floor))).sort((a, b) => b - a);
  const floors: ToolFloor[] = floorNumbers.map((floor) => ({
    floor,
    units: residential
      .filter((u) => u.floor === floor)
      .sort((a, b) => a.position - b.position)
      .map(toUnit),
  }));

  const summary: ToolRow[] = [
    { label: dict.common.district, value: demoBlock.district[locale] },
    { label: w.floors, value: num.format(floorNumbers.length + (demoBlock.commercialGroundFloor ? 1 : 0)) },
    { label: w.total, value: num.format(counts.total) },
    { label: pd.available, value: num.format(counts.available) },
    { label: pd.reserved, value: num.format(counts.reserved) },
    { label: pd.sold, value: num.format(counts.sold) },
  ];

  const labels: ToolLabels = {
    facade: `${demoBlock.project[locale]} · ${demoBlock.name[locale]}`,
    floor: pd.floor,
    commercial: w.commercial,
    legend: w.legend,
    filterRooms: w.rooms,
    filterStatus: pd.availability,
    all: w.all,
    selection: w.selection,
    summary: w.summary,
    statuses: statusLabels,
    rows: {
      rooms: w.rooms,
      areaTotal: pd.area,
      areaLiving: w.living,
      orientation: w.orientation,
      status: pd.availability,
      price: w.price,
    },
  };

  return (
    <>
      {/* ============================================================
          THE TOOL. Stone page, white tool surface. The heading is compact
          on purpose — the building is the first thing worth reading.
          ============================================================ */}
      <Section tone="stone" id="inventory">
        <Reveal>
          <span className="eyebrow">{dict.hero.badge}</span>
        </Reveal>

        <Reveal delay={0.05} stagger>
          <h1 className="mt-6 max-w-[20ch] font-display text-display-xl font-bold tracking-[-0.03em] text-ink">
            {splitWords(dict.hero.title)}
          </h1>
        </Reveal>

        {/* DEMO DATA — stated before the tool, not after it. */}
        <Reveal delay={0.1}>
          <div
            role="note"
            className="mt-8 flex max-w-2xl flex-col gap-2 border-l-2 border-brand bg-white/70 px-4 py-3.5 sm:flex-row sm:items-baseline sm:gap-4 sm:px-5"
          >
            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-label text-brand-700">
              demo
            </span>
            <p className="text-sm leading-relaxed text-ink">{DEMO_DATA_NOTICE[locale]}</p>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs uppercase tracking-label text-muted sm:mt-12">
          <span className="font-semibold text-ink">{demoBlock.project[locale]}</span>
          <span aria-hidden="true">·</span>
          <span>{demoBlock.name[locale]}</span>
          <span aria-hidden="true">·</span>
          <span>{demoBlock.district[locale]}</span>
        </div>

        <div className="mt-5">
          <InventoryTool
            columns={columns}
            floors={floors}
            ground={demoBlock.commercialGroundFloor}
            labels={labels}
            summary={summary}
          />
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{pd.floorplansSubtitle}</p>
      </Section>

      {/* ============================================================
          COUNTER STRIP — ink ground. Available out of total, then the
          rest of the breakdown. Every figure comes from demoCounts().
          ============================================================ */}
      <Section tone="default" className="bg-ink py-14 text-white sm:py-16 lg:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-label text-white/45">
              {pd.availability}
            </span>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-3 font-display text-display-lg font-bold leading-none tracking-[-0.03em] text-white">
              <Counter value={counts.available} locale={locale} className="text-brand" />
              <span className="tabular text-white/35">/ {num.format(counts.total)}</span>
              <span className="text-xs font-semibold uppercase tracking-label text-white/55">
                {w.free}
              </span>
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:gap-x-12">
            {[
              { label: pd.available, value: counts.available },
              { label: pd.reserved, value: counts.reserved },
              { label: pd.sold, value: counts.sold },
            ].map((r) => (
              <div key={r.label}>
                <dd className="tabular font-display text-2xl font-bold leading-none text-white sm:text-3xl">
                  {num.format(r.value)}
                </dd>
                <dt className="mt-2.5 text-[0.65rem] uppercase tracking-label text-white/45">
                  {r.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ============================================================
          PROJECTS — a compact row, nothing more. This direction is a
          tool; the catalogue lives on /projects.
          ============================================================ */}
      <Section tone="stone" className="py-16 sm:py-20 lg:py-24">
        <SectionHeading eyebrow={dict.featured.eyebrow} title={dict.featured.title} rule={false} />

        <ul className="mt-10 grid gap-px bg-line/12 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.slug} className="bg-stone">
              <Reveal delay={(i % 3) * 0.05} className="h-full">
                <Link
                  href={routes.project(locale, p.slug)}
                  className="group flex h-full flex-col justify-between gap-5 p-5 sm:p-6"
                >
                  <span className="block font-display text-lg font-bold leading-snug text-ink transition-transform duration-500 ease-premium group-hover:translate-x-1">
                    {p.name[locale]}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-label">
                    <span className="text-muted">{p.district[locale]}</span>
                    <span
                      className={cn(
                        'font-semibold',
                        p.status === 'construction' ? 'text-brand-700' : 'text-graphite',
                      )}
                    >
                      {dict.common.status[p.status]}
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href={routes.projects(locale)}
            className="link-underline text-sm font-semibold uppercase tracking-label text-ink"
          >
            {dict.common.viewAllProjects}
          </Link>
        </div>
      </Section>

      {/* ============================================================
          LEAD — the one thing the tool cannot do: put a human on it.
          ============================================================ */}
      <Section tone="graphite" id="lead" className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div>
            <Reveal>
              <span className="eyebrow">{dict.lead.eyebrow}</span>
            </Reveal>
            <Reveal delay={0.05} stagger>
              <h2 className="mt-5 max-w-[26ch] font-display text-display-md font-bold tracking-[-0.025em] text-white text-balance">
                {splitWords(dict.lead.title)}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-prose leading-relaxed text-white/65">
                {dict.lead.subtitle}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="flex flex-col items-start gap-5">
            <a
              href={telHref(contact.primaryPhone)}
              className="tabular font-display text-2xl font-bold tracking-[-0.02em] text-white transition-colors duration-300 ease-premium hover:text-brand sm:text-3xl"
            >
              {contact.primaryPhone}
            </a>
            <p className="text-[0.65rem] uppercase tracking-label text-white/45">
              {contact.hours[locale]}
            </p>
            <Button href={routes.contacts(locale)} arrow>
              {pd.availableApartments}
            </Button>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
