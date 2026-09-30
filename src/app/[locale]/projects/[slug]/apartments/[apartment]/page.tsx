import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { typo } from '@/lib/text';
import { getProject } from '@/content/projects';
import { companyLegalName } from '@/content/site';
import {
  apartmentParams,
  apartmentsOf,
  getApartment,
  getBuilding,
  getInventory,
} from '@/lib/inventory/repository';
import { formatArea, formatEUR, pricing } from '@/lib/pricing/engine';
import { Section } from '@/components/ui/Section';
import { SelectorShell } from '@/components/inventory/SelectorShell';
import { DemoNotice } from '@/components/inventory/DemoNotice';
import { CostCalculator } from '@/components/inventory/calculator/CostCalculator';
import { LeadSection } from '@/components/home/LeadSection';
import { PlanViewer, type ViewerLabels } from '@/components/inventory/apartment/PlanViewer';
import { ApartmentFacts, PRICE_ID } from '@/components/inventory/apartment/ApartmentFacts';
import { ApartmentActions } from '@/components/inventory/apartment/ApartmentActions';
import { ApartmentPager } from '@/components/inventory/apartment/ApartmentPager';
import { SimilarApartments } from '@/components/inventory/apartment/SimilarApartments';
import { ApartmentLead } from '@/components/inventory/apartment/ApartmentLead';
import { ApartmentMobileBar } from '@/components/inventory/apartment/ApartmentMobileBar';
import { planOrientation } from '@/components/inventory/apartment/orientation';
import { floorNeighbours, similarAvailable } from '@/components/inventory/apartment/neighbours';
import { fill } from '@/components/inventory/apartment/text';

// Static export: every apartment page is generated at build time; any other
// id is a 404, never a runtime render.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => apartmentParams().map((p) => ({ locale, ...p })));
}

type Params = { locale: string; slug: string; apartment: string };

function load(params: Params) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const inventory = getInventory(params.slug);
  const apartment = inventory ? getApartment(params.slug, params.apartment) : undefined;
  const building = inventory && apartment ? getBuilding(inventory, apartment.buildingId) : undefined;
  const project = getProject(params.slug);
  return { locale, inventory, apartment, building, project };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, inventory, apartment, building, project } = load(await props.params);
  if (!inventory || !apartment || !building || !project) return {};
  const dict = getDictionary(locale);
  const t = dict.inventory.apartment;
  const c = dict.inventory.common;
  const meta = buildMetadata({
    locale,
    routeKey: 'projects',
    slug: `${project.slug}/apartments/${apartment.id}`,
    title: fill(t.metaTitle, { n: apartment.number, project: project.name[locale] }),
    description: fill(t.metaDescription, {
      rooms: c.rooms[apartment.rooms] ?? String(apartment.rooms),
      area: formatArea(apartment.area, locale),
      floor: apartment.floor,
      building: building.name[locale],
    }),
  });
  // Demo stock must not be indexed as if it were for sale; its links still
  // lead crawlers back to real content (as on the selector's step pages).
  return inventory.demo || pricing.demo ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/**
 * Apartment page — the last step of the selector.
 *
 *   Проекты / Botanic Star 2 — блоки 3 и 4 / Блок 3 / Этаж 7 / Квартира 34
 *   БЛОК 3 · ЭТАЖ 7                                01 Корпус — 02 Этаж — 03 Квартира
 *   Квартира №34                          ← план этажа  [‹ 33] 3 из 8 на этаже [35 ›]
 *   Трёхкомнатная квартира площадью 84,6 м²…
 *   [demo notice]
 *
 *   PLAN (7–8 cols): 2D | 3D, drawing, explication    FACTS (4–5 cols): status,
 *                                                     figures, price, actions
 *   #calculator  cost + installment calculator, preset to this apartment
 *   #lead        «Заявка на квартиру №34» — the form with the apartment as context
 *
 * Phones open on the plan, like an apartment card: no step indicator (the
 * breadcrumbs and the pager already say where one is), the pager straight
 * under the title, the demo notice moved under the facts card. Once the
 * price has scrolled away, a slim bar keeps it and the lead in reach.
 *
 * Reserved: status shown, lead allowed (worded as a waiting request), similar
 * apartments offered. Sold: status and plan only — no price, no calculator;
 * similar available apartments and the way back to the floor instead, and
 * the site's general lead (matchmaking) at the foot.
 */
export default async function ApartmentPage(props: { params: Promise<Params> }) {
  const { locale, inventory, apartment, building, project } = load(await props.params);
  if (!inventory || !apartment || !building || !project) notFound();

  const dict = getDictionary(locale);
  const c = dict.inventory.common;
  const t = dict.inventory.apartment;
  const slug = project.slug;
  const projectName = project.name[locale];
  const buildingName = building.name[locale];
  const { status } = apartment;
  const sold = status === 'sold';
  const area = formatArea(apartment.area, locale);

  const title = fill(t.title, { n: apartment.number });
  const floorHref = routes.floor(locale, slug, building.id, apartment.floor);
  const buildingHref = routes.building(locale, slug, building.id);

  const kind =
    apartment.type === 'penthouse'
      ? t.summary.penthouse
      : (t.summary.kind[apartment.rooms] ?? c.rooms[apartment.rooms] ?? String(apartment.rooms));
  const summary = [
    fill(t.summary.body, { kind, area, floor: apartment.floor, floors: building.floorsCount }),
    apartment.outdoor !== 'none' &&
      fill(t.summary[apartment.outdoor], { area: formatArea(apartment.balconyArea, locale) }),
  ]
    .filter(Boolean)
    .join(' ');

  const demo = inventory.demo || pricing.demo ? { badge: c.demoBadge, text: c.demoNotice } : null;
  const statusLower = {
    available: c.status.available.toLocaleLowerCase(locale),
    reserved: c.status.reserved.toLocaleLowerCase(locale),
    sold: c.status.sold.toLocaleLowerCase(locale),
  };
  const buildingNames = Object.fromEntries(inventory.buildings.map((b) => [b.id, b.name[locale]]));
  const leadContext = fill(t.leadContext, { n: apartment.number, building: buildingName, floor: apartment.floor });

  const neighbours = floorNeighbours(
    apartment,
    apartmentsOf(inventory, { buildingId: building.id, floor: apartment.floor }),
  );
  const similar = sold || status === 'reserved' ? similarAvailable(apartment, inventory.apartments) : [];
  const hrefOf = Object.fromEntries(
    [neighbours.prev, neighbours.next, ...similar]
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => [a.id, routes.apartment(locale, slug, a.id)]),
  );

  const orientation = planOrientation(inventory, apartment);
  const outlook =
    orientation.outlook === 'courtyard'
      ? c.features['courtyard-view']
      : orientation.outlook === 'street'
        ? c.features['street-view']
        : null;
  const planOrient = { northDeg: orientation.northDeg, cornerSide: orientation.cornerSide };

  const viewerLabels: ViewerLabels = {
    title: t.viewer.title,
    modeLabel: t.viewer.modeLabel,
    mode2d: t.viewer.mode2d,
    mode3d: t.viewer.mode3d,
    soon: t.viewer.soon,
    explication: t.viewer.explication,
    indoorTotal: t.viewer.indoorTotal,
    model3d: { title: t.viewer.soonTitle, text: t.viewer.soonText, back: t.viewer.back2d },
    plan: {
      room: c.room,
      roomTpl: t.viewer.room,
      planAria: fill(t.viewer.planAria, {
        n: apartment.number,
        rooms: c.rooms[apartment.rooms] ?? String(apartment.rooms),
        area,
      }),
      entrance: t.viewer.entrance,
      facade: t.viewer.facade,
      outlook,
      north: t.viewer.north,
      northAria: t.viewer.northAria,
      metre: t.viewer.metre,
      scaleAria: t.viewer.scaleAria,
      hintHover: t.viewer.hintHover,
      hintTouch: t.viewer.hintTouch,
    },
  };

  const actions = (
    <ApartmentActions
      apartment={apartment}
      locale={locale}
      labels={t.actions}
      priceActions={!sold}
      leadLabel={status === 'reserved' ? t.actions.reservedLead : undefined}
      orientation={planOrient}
      file={{
        name: t.file.name,
        footer: `${companyLegalName} · ${t.file.generated}`,
        print: t.file.print,
        save: t.file.save,
        text: {
          project: projectName,
          title,
          subtitle: [
            c.rooms[apartment.rooms] ?? String(apartment.rooms),
            `${area} ${c.sqm}`,
            `${c.floor} ${apartment.floor}`,
            buildingName,
          ].join(' · '),
          room: c.room,
          metre: t.viewer.metre,
          facade: outlook ? `${t.viewer.facade} · ${outlook}` : t.viewer.facade,
          entrance: t.viewer.entrance,
          north: t.viewer.north,
          explication: t.viewer.explication,
          indoorTotal: t.viewer.indoorTotal,
          notes: [t.file.note, ...(demo ? [c.demoNotice] : [])],
        },
      }}
    />
  );

  // Below md the demo notice leaves the header for a place under the facts
  // card, so a phone opens on the plan.
  const demoBelowFacts = demo && <DemoNotice badge={demo.badge} text={demo.text} className="mt-10 md:hidden" />;

  return (
    <>
      {/* The step indicator is hidden below md (the breadcrumbs and the pager
          carry the context there). SelectorShell has no prop for it yet, so
          the step list — the one <ol> holding aria-current="step" — is
          hidden from here. */}
      <div className="max-md:[&_ol:has([aria-current=step])]:hidden">
      <SelectorShell
        crumbs={[
          { label: c.allProjects, href: routes.projects(locale) },
          { label: projectName, href: routes.project(locale, slug) },
          { label: buildingName, href: buildingHref },
          { label: fill(t.crumbFloor, { n: apartment.floor }), href: floorHref },
          { label: fill(t.crumb, { n: apartment.number }) },
        ]}
        eyebrow={fill(t.eyebrow, { building: buildingName, floor: apartment.floor })}
        title={title}
        lead={typo(summary)}
        step="apartment"
        stepLabels={c.steps}
        stepHrefs={{ building: routes.selector(locale, slug), floor: buildingHref }}
        demo={null}
        aside={
          <ApartmentPager
            prev={neighbours.prev}
            next={neighbours.next}
            index={neighbours.index}
            total={neighbours.total}
            floorHref={floorHref}
            hrefOf={hrefOf}
            labels={t.pager}
            statusLabel={statusLower}
          />
        }
      >
        {demo && <DemoNotice badge={demo.badge} text={demo.text} className="-mt-2 mb-10 max-md:hidden md:-mt-4 md:mb-14" />}
        <PlanViewer
          apartment={apartment}
          locale={locale}
          labels={viewerLabels}
          orientation={planOrient}
          aside={
            <ApartmentFacts
              apartment={apartment}
              locale={locale}
              dict={dict}
              buildingName={buildingName}
              floorsCount={building.floorsCount}
              showPriceNote={pricing.demo}
              actions={actions}
              after={
                <>
                  {status !== 'available' && (
                    <SimilarApartments
                      note={sold ? t.status.sold : t.status.reserved}
                      items={similar}
                      hrefOf={hrefOf}
                      locale={locale}
                      labels={t.similar}
                      roomsLabel={c.rooms}
                      buildingId={building.id}
                      buildingName={buildingNames}
                      links={[
                        { href: floorHref, label: fill(t.similar.onFloor, { n: apartment.floor }) },
                        { href: buildingHref, label: fill(t.similar.inBuilding, { building: buildingName }) },
                      ]}
                    />
                  )}
                  {demoBelowFacts}
                </>
              }
            />
          }
        />
      </SelectorShell>
      </div>

      {/* The calculator draws no ground of its own: it sits on the alternate
          tone, between the canvas of the plan and the band of the lead. */}
      {!sold && (
        <Section tone="alt">
          <CostCalculator
            locale={locale}
            dict={dict}
            id="calculator"
            preset={{
              projectSlug: slug,
              buildingId: building.id,
              rooms: apartment.rooms,
              area: apartment.area,
              floor: apartment.floor,
              type: apartment.type,
              outdoor: apartment.outdoor,
              outdoorArea: apartment.balconyArea,
              parking: 'none',
              apartmentId: apartment.id,
            }}
          />
        </Section>
      )}

      {sold ? (
        <LeadSection locale={locale} dict={dict} id="lead" projectName={projectName} />
      ) : (
        <ApartmentLead
          locale={locale}
          dict={dict}
          id="lead"
          title={fill(t.leadSection.title, { n: apartment.number })}
          lead={status === 'reserved' ? t.leadSection.leadReserved : t.leadSection.lead}
          submitLabel={status === 'reserved' ? t.actions.reservedLead : t.leadSection.submit}
          next={{
            title: t.leadSection.nextTitle,
            steps: status === 'reserved' ? t.leadSection.nextReserved : t.leadSection.next,
          }}
          projectName={projectName}
          apartment={leadContext}
        />
      )}

      {!sold && (
        <ApartmentMobileBar
          label={title}
          price={formatEUR(apartment.totalPrice, locale)}
          action={status === 'reserved' ? t.actions.reservedLeadShort : t.actions.lead}
          after={PRICE_ID}
          hideOn={['calculator', 'lead']}
          apartmentId={apartment.id}
          status={status}
        />
      )}
    </>
  );
}
