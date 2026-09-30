import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getProject } from '@/content/projects';
import { apartmentsOf, getInventory, selectorParams, stats } from '@/lib/inventory/repository';
import type { AvailabilityStats, ProjectInventory } from '@/lib/inventory/types';
import { pricing } from '@/lib/pricing/engine';
import { SelectorShell } from '@/components/inventory/SelectorShell';
import { BuildingStep } from '@/components/inventory/selector/BuildingStep';
import { Recommender } from '@/components/inventory/recommend/Recommender';
import { LeadSection } from '@/components/home/LeadSection';

/**
 * Apartment selector, step 1 — /{locale}/projects/{slug}/select.
 * Choose a building on the axonometric scheme of the complex. Static export:
 * one page per project with an inventory, in every locale.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => selectorParams().map(({ slug }) => ({ locale, slug })));
}

type Params = { locale: string; slug: string };

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const project = getProject(params.slug);
  const inventory = getInventory(params.slug);
  if (!project || !inventory) return {};
  const dict = getDictionary(locale);
  const meta = buildMetadata({
    locale,
    routeKey: 'projects',
    slug: `${project.slug}/select`,
    title: `${dict.inventory.common.selectorTitle} — ${project.name[locale]}`,
    description: dict.inventory.selector.metaDescription,
  });
  // Demo stock must not be indexed as real availability.
  return inventory.demo ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function SelectBuildingPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const project = getProject(params.slug);
  const inventory = getInventory(params.slug);
  if (!project || !inventory) notFound();

  const dict = getDictionary(locale);
  const common = dict.inventory.common;
  const t = dict.inventory.selector;
  const projectName = project.name[locale];

  const buildingStats: Record<string, AvailabilityStats> = Object.fromEntries(
    inventory.buildings.map((b) => [b.id, stats(apartmentsOf(inventory, { buildingId: b.id }))]),
  );
  const totalStats = stats(inventory.apartments);

  // The scheme needs the site and the buildings only: leave the apartment list
  // and floor plates (plans, polygons) out of the client payload.
  const scheme: ProjectInventory = { ...inventory, apartments: [], plates: [] };

  const updated = new Intl.DateTimeFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${inventory.updatedAt}T00:00:00`));

  return (
    <>
      <SelectorShell
        crumbs={[
          { label: common.allProjects, href: routes.projects(locale) },
          { label: projectName, href: routes.project(locale, project.slug) },
          { label: common.selectorTitle },
        ]}
        // The last crumb already says «Выбор квартиры»; the eyebrow names the
        // project, as later steps name the building and the floor.
        eyebrow={projectName}
        title={t.title}
        lead={t.lead}
        step="building"
        stepLabels={common.steps}
        demo={inventory.demo ? { badge: common.demoBadge, text: common.demoNotice } : null}
        aside={
          <p className="label tabular text-muted">
            {common.updated} {updated}
          </p>
        }
      >
        <BuildingStep
          locale={locale}
          projectSlug={project.slug}
          projectName={projectName}
          inventory={scheme}
          buildingStats={buildingStats}
          totalStats={totalStats}
          priceDemo={pricing.demo}
          common={common}
          t={t}
        />
      </SelectorShell>

      {/* The demo notice is already under the title (SelectorShell). */}
      <Recommender locale={locale} dict={dict} projectSlug={project.slug} id="recommend" showDemoNotice={false} />

      {/* «Оставить заявку» from the recommender (results and empty state)
          lands here, on #lead, instead of leaving the selector. */}
      <LeadSection locale={locale} dict={dict} projectName={projectName} id="lead" />
    </>
  );
}
