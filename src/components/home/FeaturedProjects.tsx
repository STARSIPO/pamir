import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { ProjectFeature } from './ProjectFeature';

/**
 * The two projects under construction, curated. Everything else lives in the
 * Spotlight and "More projects" further down, so the homepage shows the whole
 * catalogue once, without the filter UI of /projects.
 */
export const FEATURED_SLUGS = ['botanic-star-2-blocks-3-4', 'eco-house'] as const;

/**
 * Per-row frame. Landscape first, portrait second: two rows of the same shape
 * would read as a template. Eco House's cover is a tall render, which suits
 * the portrait slot.
 */
const ROWS: { aspect: string; position?: string }[] = [
  { aspect: '5 / 4', position: '40% 50%' },
  { aspect: '4 / 5', position: '50% 50%' },
];

export function FeaturedProjects({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = FEATURED_SLUGS.map((slug) => getProject(slug)).filter((p): p is Project => !!p);

  return (
    <Section tone="canvas">
      <SectionHeading
        index="02"
        eyebrow={dict.featured.eyebrow}
        title={dict.featured.title}
        subtitle={dict.featured.subtitle}
        action={
          <Button href={routes.projects(locale)} variant="ghost" arrow className="self-start">
            {dict.featured.cta}
          </Button>
        }
      />

      <div className="mt-section-sm flex flex-col gap-y-section">
        {featured.map((project, i) => (
          <ProjectFeature
            key={project.slug}
            project={project}
            locale={locale}
            dict={dict}
            index={i}
            total={featured.length}
            reverse={i % 2 === 1}
            aspect={ROWS[i % ROWS.length].aspect}
            position={ROWS[i % ROWS.length].position}
          />
        ))}
      </div>
    </Section>
  );
}
