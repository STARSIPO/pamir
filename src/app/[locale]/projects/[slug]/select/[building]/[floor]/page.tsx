import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getProject } from '@/content/projects';
import {
  apartmentsOf,
  floorParams,
  getBuilding,
  getInventory,
  getPlate,
  residentialFloors,
  stats,
} from '@/lib/inventory/repository';
import { pricing } from '@/lib/pricing/engine';
import { SelectorShell } from '@/components/inventory/SelectorShell';
import { formatEUR } from '@/components/inventory/format';
import { FloorPlanStep } from '@/components/inventory/selector/FloorPlanStep';
import { FloorStats } from '@/components/inventory/selector/FloorStats';
import { FloorSwitcher } from '@/components/inventory/selector/FloorSwitcher';
import { fill } from '@/components/inventory/selector/FloorFormat';

type Params = { locale: string; slug: string; building: string; floor: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => floorParams().map((p) => ({ locale, ...p })));
}

function load(params: Params) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const inventory = getInventory(params.slug);
  const project = getProject(params.slug);
  const building = inventory ? getBuilding(inventory, params.building) : undefined;
  const floor = Number(params.floor);
  const plateId = building?.floorPlates[floor];
  const plate = inventory && plateId ? getPlate(inventory, plateId) : undefined;
  return { locale, inventory, project, building, floor, plate };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const { locale, inventory, project, building, floor, plate } = load(params);
  if (!inventory || !project || !building || !plate) return {};
  const t = getDictionary(locale).inventory.floors;
  const vars = { project: project.name[locale], building: building.name[locale], floor };
  const meta = buildMetadata({
    locale,
    routeKey: 'projects',
    slug: `${project.slug}/select/${building.id}/${floor}`,
    title: `${fill(t.metaFloor, vars)} · ${project.name[locale]}`,
    description: fill(t.metaFloorDescription, vars),
  });
  return inventory.demo ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/**
 * Step 3 of the apartment selector: one floor, choose an apartment.
 *   Проекты / Botanic Star 2 — блоки 3 и 4 / Блок 3 / Этаж 7
 *   Блок 3, этаж 7                         01 Корпус — 02 Этаж — 03 Квартира
 *   ← 2 3 4 5 6 [7] 8 9 10 →
 *   [ floor plan ]                         [ apartments of the floor ]
 */
export default async function FloorSelectPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const { locale, inventory, project, building, floor, plate } = load(params);
  if (!inventory || !project || !building || !plate) notFound();

  const dict = getDictionary(locale);
  const common = dict.inventory.common;
  const t = dict.inventory.floors;
  const name = building.name[locale];

  const apartments = apartmentsOf(inventory, { buildingId: building.id, floor });
  const s = stats(apartments);
  const apartmentHrefs = Object.fromEntries(
    apartments.map((a) => [a.id, routes.apartment(locale, inventory.projectSlug, a.id)]),
  );
  const floors = residentialFloors(building).map((f) => ({
    floor: f,
    href: routes.floor(locale, inventory.projectSlug, building.id, f),
    available: stats(apartmentsOf(inventory, { buildingId: building.id, floor: f })).available,
  }));
  // The client gets the site/plates frame and this floor's apartments only.
  const scoped = { ...inventory, apartments };

  return (
    <SelectorShell
      crumbs={[
        { label: common.allProjects, href: routes.projects(locale) },
        { label: project.name[locale], href: routes.project(locale, project.slug) },
        { label: name, href: routes.building(locale, project.slug, building.id) },
        { label: `${common.floor} ${floor}` },
      ]}
      eyebrow={common.selectorTitle}
      title={fill(t.floorTitle, { building: name, floor })}
      lead={t.floorLead}
      step="apartment"
      stepLabels={common.steps}
      stepHrefs={{
        building: routes.selector(locale, project.slug),
        floor: routes.building(locale, project.slug, building.id),
      }}
      demo={inventory.demo || pricing.demo ? { badge: common.demoBadge, text: common.demoNotice } : null}
      aside={
        <FloorStats
          items={[
            { label: t.statAvailable, value: fill(t.availableOf, { available: s.available, total: s.total }) },
            ...(s.priceFrom !== null ? [{ label: t.statFrom, value: formatEUR(s.priceFrom, locale) }] : []),
          ]}
        />
      }
    >
      <FloorSwitcher
        floors={floors}
        current={floor}
        label={t.switcher}
        prevLabel={t.prevFloor}
        nextLabel={t.nextFloor}
        floorWord={common.floor}
        className="mb-10 md:mb-14"
      />
      <FloorPlanStep
        key={`${building.id}-${floor}`}
        inventory={scoped}
        building={building}
        plate={plate}
        floor={floor}
        apartments={apartments}
        apartmentHrefs={apartmentHrefs}
        locale={locale}
        t={t}
        common={common}
      />
      {pricing.demo && <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">{common.priceNote}</p>}
    </SelectorShell>
  );
}
