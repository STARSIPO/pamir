import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { projects } from '@/content/projects';
import { PageHero } from '@/components/shared/PageHero';
import { Container } from '@/components/ui/Container';
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
      <div className="bg-white py-16 lg:py-24">
        <Container>
          <ProjectsExplorer projects={projects} locale={locale} dict={dict} showFilters />
        </Container>
      </div>
      <CtaBand locale={locale} dict={dict} title={dict.projectDetail.ctaTitle} subtitle={dict.projectDetail.ctaSubtitle} />
    </>
  );
}
