import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';
import { getFeaturedProjects } from '@/content/projects';
import { routes } from '@/i18n/routing';

export function FeaturedProjects({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // Three, not all six, and no filter chips: the homepage was rendering the
  // entire /projects page inline — same cards, same all/construction/completed
  // filters — so "смотреть все проекты" led somewhere the visitor had already
  // been. A teaser has to leave something behind the link.
  const featured = getFeaturedProjects().slice(0, 3);

  return (
    <Section tone="default">
      <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <SectionHeading
            eyebrow={dict.featured.eyebrow}
            title={dict.featured.title}
            subtitle={dict.featured.subtitle}
          />
        </div>
        <Reveal delay={0.1}>
          <Button href={routes.projects(locale)} variant="ghost" arrow className="shrink-0">
            {dict.featured.cta}
          </Button>
        </Reveal>
      </div>

      <ProjectsExplorer projects={featured} locale={locale} dict={dict} />
    </Section>
  );
}
