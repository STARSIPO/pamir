import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { ProjectRow, rowSizes } from '@/components/projects/ProjectRow';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { catalogueAvailability } from '@/lib/inventory/availability';
import { FEATURED_SLUGS } from './FeaturedProjects';
import { SPOTLIGHT_SLUG } from './Spotlight';

/**
 * 04 — More projects: the projects not already shown above, as one even
 * column of framed rows — the same ProjectRow the catalogue uses, so every
 * project list on the site reads the same way (client's request, 2026-09-30).
 */
export function MoreProjects({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const shown = new Set<string>([...FEATURED_SLUGS, SPOTLIGHT_SLUG]);
  const rest = projects.filter((p) => !shown.has(p.slug));
  if (rest.length === 0) return null;
  const availability = catalogueAvailability();

  return (
    <Section tone="canvas">
      <SectionHeading
        index="04"
        eyebrow={dict.design.moreEyebrow}
        title={dict.design.moreTitle}
        subtitle={dict.design.moreSubtitle}
        action={
          <Button href={routes.projects(locale)} variant="ghost" arrow className="self-start">
            {dict.featured.cta}
          </Button>
        }
      />

      {/* Rows side by side from md share one height, so the frames line up. */}
      <ul role="list" className="mt-section-sm grid grid-cols-1 gap-6 md:auto-rows-fr md:gap-8">
        {rest.map((project, i) => (
          <li key={project.slug}>
            <ProjectRow
              project={project}
              locale={locale}
              dict={dict}
              index={i}
              sizes={rowSizes(project.cover)}
              availability={availability[project.slug]}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
