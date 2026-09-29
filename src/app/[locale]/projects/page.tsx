import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { projects } from '@/content/projects';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';
import { CtaBand } from '@/components/shared/CtaBand';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    routeKey: 'projects',
    title: dict.projectsPage.title,
    description: dict.projectsPage.subtitle,
  });
}

/**
 * Project catalogue: a typographic opening, then the portfolio itself —
 * filter tabs over large photographs in an asymmetric rhythm — and the
 * closing CTA on the band, which runs straight into the band footer.
 */
export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero
        eyebrow={dict.projectsPage.eyebrow}
        title={dict.projectsPage.title}
        subtitle={dict.projectsPage.subtitle}
      />
      <Section spacing="none" className="pb-section">
        {/* Keeps the outline h1 → h2 → h3 (card names) without a visible heading. */}
        <h2 className="sr-only">{dict.common.viewAllProjects}</h2>
        <ProjectsExplorer projects={projects} locale={locale} dict={dict} showFilters />
      </Section>
      <CtaBand locale={locale} dict={dict} title={dict.projectDetail.ctaTitle} subtitle={dict.projectDetail.ctaSubtitle} />
    </>
  );
}
