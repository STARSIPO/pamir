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
 *
 * Its cover is also a crop of the Hero's render, so shown whole it repeats
 * the opening photo two screens later (same corner, same car and passer-by).
 * Row 2 therefore goes in close: scaled 1.35x from the top-right corner, it
 * keeps the rhythm of the orange loggias and the wing receding into the sky
 * and drops the street, the corner tower the Hero crops to on a phone, and the
 * figures. `[scale:…]` is the standalone CSS property, so it composes with the
 * hover zoom and the mask reveal (both set `transform`); `sizes` grows by the
 * same 1.35 so the enlarged image is not upscaled.
 */
const ROWS: { aspect: string; position?: string; imgClassName?: string; sizes?: string }[] = [
  { aspect: '5 / 4', position: '40% 50%' },
  {
    aspect: '4 / 5',
    position: '100% 0%',
    imgClassName: '[scale:1.35] origin-top-right',
    sizes: '(max-width: 767px) 135vw, (max-width: 1023px) 90vw, 68vw',
  },
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
        {featured.map((project, i) => {
          const row = ROWS[i % ROWS.length];
          return (
            <ProjectFeature
              key={project.slug}
              project={project}
              locale={locale}
              dict={dict}
              index={i}
              total={featured.length}
              reverse={i % 2 === 1}
              aspect={row.aspect}
              position={row.position}
              imgClassName={row.imgClassName}
              sizes={row.sizes}
            />
          );
        })}
      </div>
    </Section>
  );
}
