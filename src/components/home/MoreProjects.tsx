import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { FEATURED_SLUGS } from './FeaturedProjects';
import { SPOTLIGHT_SLUG } from './Spotlight';

/**
 * Slots of the asymmetric grid, in order. Each frame follows its photograph:
 * a landscape render, the tall worm's-eye photo of Botanic Star, then a wide
 * street photo. On lg the second card drops below the first so the two never
 * share a top edge; the third closes the grid off-centre.
 *
 * ProjectCard sets its name and "view project" side by side from md up, which
 * needs ~400px of width. So md stays asymmetric but in wide frames only (two
 * 50% columns on a tablet would squeeze a name into four lines), and the
 * narrow portrait slot only takes 4 columns (with an empty one beside the
 * first card) once the viewport can afford it, at 1360px. Below that it takes
 * 5; the 160px drop still keeps it from reading as a row with the first card.
 */
const SLOTS: { aspect: string; className: string; sizes: string }[] = [
  {
    aspect: '5 / 4',
    className: 'md:col-span-12 lg:col-span-7',
    sizes: '(max-width: 1023px) 100vw, 58vw',
  },
  {
    aspect: '3 / 4',
    className:
      'md:col-span-8 md:col-start-5 lg:col-span-5 lg:col-start-8 lg:mt-40 min-[1360px]:col-span-4 min-[1360px]:col-start-9',
    sizes: '(max-width: 767px) 100vw, (max-width: 1023px) 66vw, 40vw',
  },
  {
    aspect: '16 / 10',
    className: 'md:col-span-12 lg:col-span-8 lg:col-start-3',
    sizes: '(max-width: 1023px) 100vw, 66vw',
  },
];

export function MoreProjects({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const shown = new Set<string>([...FEATURED_SLUGS, SPOTLIGHT_SLUG]);
  const rest = projects.filter((p) => !shown.has(p.slug));
  if (rest.length === 0) return null;

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

      <div className="mt-section-sm grid grid-cols-1 gap-y-20 md:grid-cols-12 md:gap-x-gutter md:gap-y-24 lg:gap-y-32">
        {rest.map((project, i) => {
          const slot = SLOTS[i % SLOTS.length];
          return (
            <ProjectCard
              key={project.slug}
              project={project}
              locale={locale}
              dict={dict}
              index={i}
              aspect={slot.aspect}
              sizes={slot.sizes}
              className={slot.className}
            />
          );
        })}
      </div>
    </Section>
  );
}
