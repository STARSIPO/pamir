import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getProject } from '@/content/projects';
import { apartmentsOf, buildingParams, getBuilding, getInventory, residentialFloors, stats } from '@/lib/inventory/repository';
import type { AvailabilityStats } from '@/lib/inventory/types';
import { pricing } from '@/lib/pricing/engine';
import { SelectorShell } from '@/components/inventory/SelectorShell';
import { formatEUR } from '@/components/inventory/format';
import { FloorStep } from '@/components/inventory/selector/FloorStep';
import { FloorStats } from '@/components/inventory/selector/FloorStats';
import { counted, fill } from '@/components/inventory/selector/FloorFormat';

type Params = { locale: string; slug: string; building: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => buildingParams().map((p) => ({ locale, ...p })));
}

function load(params: Params) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const inventory = getInventory(params.slug);
  const project = getProject(params.slug);
  const building = inventory ? getBuilding(inventory, params.building) : undefined;
  return { locale, inventory, project, building };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const { locale, inventory, project, building } = load(params);
  if (!inventory || !project || !building) return {};
  const t = getDictionary(locale).inventory.floors;
  const name = building.name[locale];
  const meta = buildMetadata({
    locale,
    routeKey: 'projects',
    slug: `${project.slug}/select/${building.id}`,
    title: `${fill(t.metaBuilding, { building: name })} · ${project.name[locale]}`,
    description: fill(t.metaBuildingDescription, {
      project: project.name[locale],
      building: name,
      floors: counted(t.floorsForms, building.floorsCount, locale),
    }),
  });
  return inventory.demo ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/**
 * Step 2 of the apartment selector: one building, choose a floor.
 *   Проекты / Botanic Star 2 — блоки 3 и 4 / Блок 3
 *   Блок 3 — выберите этаж                 01 Корпус — 02 Этаж — 03 Квартира
 *   [ elevation ]                          [ floors: 10 … 2 ]
 */
export default async function BuildingSelectPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const { locale, inventory, project, building } = load(params);
  if (!inventory || !project || !building) notFound();

  const dict = getDictionary(locale);
  const common = dict.inventory.common;
  const t = dict.inventory.floors;
  const name = building.name[locale];

  const floorStats: Record<number, AvailabilityStats> = {};
  const floorHrefs: Record<number, string> = {};
  for (const f of residentialFloors(building)) {
    floorStats[f] = stats(apartmentsOf(inventory, { buildingId: building.id, floor: f }));
    floorHrefs[f] = routes.floor(locale, inventory.projectSlug, building.id, f);
  }
  const buildingApartments = apartmentsOf(inventory, { buildingId: building.id });
  const total = stats(buildingApartments);
  // The client only needs this building's apartments (elevation geometry).
  const scoped = { ...inventory, apartments: buildingApartments };

  return (
    <SelectorShell
      crumbs={[
        { label: common.allProjects, href: routes.projects(locale) },
        { label: project.name[locale], href: routes.project(locale, project.slug) },
        { label: name },
      ]}
      eyebrow={common.selectorTitle}
      title={fill(t.buildingTitle, { building: name })}
      lead={t.buildingLead}
      step="floor"
      stepLabels={common.steps}
      stepHrefs={{ building: routes.selector(locale, project.slug) }}
      demo={inventory.demo || pricing.demo ? { badge: common.demoBadge, text: common.demoNotice } : null}
      aside={
        <FloorStats
          items={[
            { label: t.statFloors, value: String(building.floorsCount) },
            { label: t.statAvailable, value: `${total.available} / ${total.total}` },
            ...(total.priceFrom !== null
              ? [{ label: t.statFrom, value: formatEUR(total.priceFrom, locale) }]
              : []),
          ]}
        />
      }
    >
      <FloorStep
        inventory={scoped}
        building={building}
        locale={locale}
        floorStats={floorStats}
        floorHrefs={floorHrefs}
        t={t}
        common={common}
      />
      {pricing.demo && <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">{common.priceNote}</p>}
    </SelectorShell>
  );
}
