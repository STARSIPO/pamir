import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { routes } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { typesetName } from '@/lib/text';
import { Media } from '@/components/ui/Media';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLabel } from '@/components/ui/Button';

/**
 * Project card: a large photograph and a large name — nothing else competes.
 *
 *   ┌──────────────────────────┐
 *   │                          │   the image opens with a mask reveal and
 *   │         photo            │   zooms ~3.5% on hover, slowly
 *   │                          │
 *   └──────────────────────────┘
 *   ■ В строительстве · Ботаника
 *   Botanic Star 2 —
 *   блоки 3 и 4
 *   Смотреть проект →
 *
 * `size="lg"` sets the name one step larger for hero-sized cards. `aspect`
 * lets a layout vary the frame (portrait, landscape, panoramic) so a grid of
 * cards does not read as a template.
 */
export function ProjectCard({
  project,
  locale,
  dict,
  priority = false,
  index = 0,
  aspect = '4 / 5',
  size = 'md',
  sizes = '(max-width: 768px) 100vw, 50vw',
  className,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  index?: number;
  aspect?: string;
  size?: 'md' | 'lg';
  sizes?: string;
  className?: string;
}) {
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;
  const caption = project.coverKind === 'render' ? dict.design.render : undefined;

  return (
    <Link href={routes.project(locale, project.slug)} className={cn('group block', className)}>
      <Reveal variant="mask">
        <Media
          src={project.cover}
          alt=""
          aspect={aspect}
          seed={index}
          priority={priority}
          label={project.name[locale]}
          sizes={sizes}
          caption={caption}
          position={project.coverPosition}
          zoom
        />
      </Reveal>

      {/* Stacked at every width: the name is the card's main typographic
          element and gets the full card measure. Beside the arrow label it
          lost ~210px and broke as "Botanic Star / 2 — блок 1". */}
      <div className="mt-6 flex flex-col items-start gap-5 md:mt-7 md:gap-6">
        <div className="min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <StatusBadge status={project.status} label={statusLabel} />
            <span aria-hidden="true" className="label">·</span>
            <span className="label">{project.district[locale]}</span>
          </div>
          <h3
            className={cn(
              'mt-4 font-display font-light text-balance text-ink',
              size === 'lg' ? 'text-display-lg' : 'text-display-md',
            )}
          >
            {typesetName(project.name[locale])}
          </h3>
        </div>
        <ArrowLabel className="text-ink">{dict.common.viewProject}</ArrowLabel>
      </div>
    </Link>
  );
}
