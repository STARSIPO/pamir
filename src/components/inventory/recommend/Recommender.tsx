import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getProject } from '@/content/projects';
import { listInventories } from '@/lib/inventory/repository';
import { pricing } from '@/lib/pricing/engine';
import { recommendationBounds, recommendationPool } from '@/lib/recommend';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { RecommenderPanel, type RecommenderLabels } from './RecommenderPanel';
import { RecommenderDemoNotice } from './RecommenderNotice';

/**
 * «Поможем подобрать квартиру» — smart recommendation block.
 *
 * Budget, rooms, minimum area and floor preference → the 3–5 available
 * apartments that match best, each with its score, the reasons and any
 * compromise, linking to the apartment page. Ranking comes from the
 * recommendation provider (src/lib/recommend — local scoring today, an AI
 * API later, same interface).
 *
 * Renders its own <Section> (`id` is the anchor, default "recommend") unless
 * `bare`, for hosts that frame it themselves. Renders nothing when the
 * project has no apartments on sale. Works as a Server Component: the pool's
 * ranges and the building / project names are resolved here, and the client
 * panel loads the inventory only when the buyer asks.
 *
 * The empty state links to `leadHref` (default "#lead", the LeadSection on
 * project and selector pages).
 *
 * Demo stock: the notice closes the block only where the page has none of its
 * own — selector and apartment pages carry it under the title (SelectorShell).
 * `showDemoNotice` true / false overrides that.
 */
export function Recommender({
  locale,
  dict,
  projectSlug,
  id = 'recommend',
  index,
  tone = 'canvas',
  bare = false,
  leadHref = '#lead',
  showDemoNotice,
}: {
  locale: Locale;
  dict: Dictionary;
  projectSlug?: string;
  id?: string;
  /** Section number beside the eyebrow ("05"), when the host numbers its sections. */
  index?: string;
  tone?: 'canvas' | 'alt' | 'surface';
  /** Skip the <Section> wrapper (heading, panel and notice only). */
  bare?: boolean;
  leadHref?: string;
  /**
   * Demo notice under the block while the stock is demo. Default: only when
   * the page does not show one already (not on selector / apartment pages).
   */
  showDemoNotice?: boolean;
}) {
  const bounds = recommendationBounds(recommendationPool(projectSlug));
  if (!bounds) return null;

  const t = dict.inventory.recommend;
  const common = dict.inventory.common;
  const inventories = listInventories().filter((inv) => !projectSlug || inv.projectSlug === projectSlug);
  const labels: RecommenderLabels = { buildings: {}, projects: {}, showProject: inventories.length > 1 };
  for (const inv of inventories) {
    labels.projects[inv.projectSlug] = getProject(inv.projectSlug)?.name[locale] ?? inv.projectSlug;
    for (const b of inv.buildings) labels.buildings[`${inv.projectSlug}/${b.id}`] = b.name[locale];
  }
  const demo = inventories.some((inv) => inv.demo);

  const content = (
    <>
      <SectionHeading index={index} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" />
      <RecommenderPanel
        locale={locale}
        t={t}
        common={common}
        bounds={bounds}
        projectSlug={projectSlug}
        labels={labels}
        priceNote={pricing.demo ? common.priceNote : undefined}
        leadHref={leadHref}
      />
      {demo && showDemoNotice !== false && (
        <RecommenderDemoNotice
          badge={common.demoBadge}
          text={common.demoNotice}
          show={showDemoNotice}
          className="mt-16 md:mt-20"
        />
      )}
    </>
  );

  if (bare) return <div id={id}>{content}</div>;
  return (
    <Section id={id} tone={tone} className="scroll-mt-[var(--header-h-compact)]">
      {content}
    </Section>
  );
}
