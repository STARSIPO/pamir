import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer';
import { getFeaturedProjects } from '@/content/projects';
import { routes } from '@/i18n/routing';

export function FeaturedProjects({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = getFeaturedProjects();

  return (
    <Section tone="sand">
      <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow">{dict.featured.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-display-lg font-semibold text-balance">
              {dict.featured.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-xl text-lg text-muted">{dict.featured.subtitle}</p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Button href={routes.projects(locale)} variant="ghost" arrow className="shrink-0">
            {dict.featured.cta}
          </Button>
        </Reveal>
      </div>

      <ProjectsExplorer projects={featured} locale={locale} dict={dict} showFilters />
    </Section>
  );
}
