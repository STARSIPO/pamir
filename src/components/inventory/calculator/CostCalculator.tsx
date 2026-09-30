import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';
import type { ParkingOption } from '@/lib/pricing/engine';
import { pricedProjects } from '@/lib/pricing/engine';
import { initialCalculatorState, type CalculatorStateInput } from '@/lib/pricing/calculator';
// Server side only: reads the inventory. The client part imports only the
// pure helpers of '@/lib/pricing/calculator'.
import { calculatorSetup } from '@/lib/pricing/calculator-setup';
import { allApartments, getApartment, getInventory } from '@/lib/inventory/repository';
import { getProject } from '@/content/projects';
import { CalculatorClient, type CalculatorApartmentContext, type CalculatorProjectOption } from './CalculatorClient';

export interface CalculatorPreset {
  projectSlug?: string;
  buildingId?: string;
  rooms?: number;
  area?: number;
  floor?: number;
  type?: ApartmentType;
  outdoor?: OutdoorType;
  outdoorArea?: number;
  parking?: ParkingOption;
  /** Apartment id when opened from an apartment page (shown as context). */
  apartmentId?: string;
}

/**
 * «Рассчитайте стоимость вашей квартиры» — the cost & installment calculator.
 *
 * Renders its own heading (eyebrow + title + subtitle) and draws no background
 * or padding: place it inside a `<Section>` of the page's choosing. `id` is
 * the block's anchor (default "calculator"); «Оставить заявку» links to
 * `#lead`, the LeadSection every project / apartment page closes with.
 *
 * `preset` pre-fills the inputs. With `apartmentId` the apartment's own
 * figures fill every field not given explicitly, the result plate reads
 * «По квартире №34 · Блок 3 · Этаж 7», and the estimate equals the
 * apartment's price (both come from the same engine).
 *
 * Not a client component itself: the project list, ranges and apartment
 * context are resolved here (on the server when rendered from a page), so
 * the browser receives a few small objects instead of the inventory.
 */
export function CostCalculator({
  locale,
  dict,
  preset,
  defaultMode = 'price',
  id = 'calculator',
}: {
  locale: Locale;
  dict: Dictionary;
  preset?: CalculatorPreset;
  defaultMode?: 'price' | 'installment';
  id?: string;
}) {
  const slugs = pricedProjects();
  if (!slugs.length) return null;

  const projects: CalculatorProjectOption[] = slugs.map((slug) => {
    const inv = getInventory(slug);
    return {
      slug,
      name: getProject(slug)?.name[locale] ?? slug,
      setup: calculatorSetup(slug),
      buildingNames: Object.fromEntries((inv?.buildings ?? []).map((b) => [b.id, b.name[locale]])),
    };
  });

  // The apartment behind the preset, if any: its figures fill the gaps.
  const apartment = preset?.apartmentId
    ? preset.projectSlug
      ? getApartment(preset.projectSlug, preset.apartmentId)
      : allApartments().find((a) => a.id === preset.apartmentId)
    : undefined;

  const given = Object.fromEntries(
    Object.entries(preset ?? {}).filter(([k, v]) => v !== undefined && k !== 'apartmentId'),
  ) as CalculatorStateInput;
  const merged: CalculatorStateInput = apartment
    ? {
        projectSlug: apartment.projectSlug,
        buildingId: apartment.buildingId,
        rooms: apartment.rooms,
        area: apartment.area,
        floor: apartment.floor,
        type: apartment.type,
        outdoor: apartment.outdoor,
        outdoorArea: apartment.balconyArea,
        parking: 'none',
        ...given,
      }
    : given;

  const project = projects.find((p) => p.slug === merged.projectSlug) ?? projects[0];
  const initial = initialCalculatorState(project.setup, merged);

  const context: CalculatorApartmentContext | null =
    apartment && apartment.projectSlug === project.slug
      ? {
          id: apartment.id,
          number: apartment.number,
          building: project.buildingNames[apartment.buildingId],
          floor: apartment.floor,
        }
      : null;

  return (
    <CalculatorClient
      id={id}
      locale={locale}
      t={dict.inventory.calculator}
      c={dict.inventory.common}
      projects={projects}
      initial={initial}
      context={context}
      defaultMode={defaultMode}
      apartmentId={apartment?.id ?? preset?.apartmentId}
    />
  );
}
