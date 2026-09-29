import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { routes } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Media } from '@/components/ui/Media';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLabel } from '@/components/ui/Button';

const NBSP = '\u00A0';

/**
 * Typeset a project name for display sizes with non-breaking spaces, so a
 * wrapped name never strands a piece of itself:
 *   - a spaced dash stays on the line before it ("Star 2 —" / "блоки 3 и 4"),
 *   - a numeral stays with the word before it ("Star 2", "блок 1"),
 *   - a one- or two-letter word stays with the word after it ("и 4", "și 4").
 * Language-neutral: it only moves spaces, never changes the words.
 */
export function typesetName(text: string) {
  return text
    .replace(/ ([—–]) /g, `${NBSP}$1 `)
    .replace(/ (\d)/g, `${NBSP}$1`)
    .replace(/(^|\s)([^\s—–]{1,2}) /g, `$1$2${NBSP}`);
}

/**
 * Like splitWords (src/lib/text.ts), but splits on ordinary spaces only, so
 * the groups tied by typesetName() arrive — and wrap — as one unit. The
 * `.word` spans are inline-blocks: split at a no-break space, they would
 * still break between them.
 */
export function splitTied(text: string): React.ReactNode {
  let i = 0;
  return text.split(/( +)/).map((part, k) =>
    part.trim() === '' ? (
      part
    ) : (
      <span key={k} className="word" style={{ '--i': i++ } as React.CSSProperties}>
        {part}
      </span>
    ),
  );
}

/**
 * One project as a large editorial row — the homepage's main project format.
 *
 *   ┌───────────────────────────────┐
 *   │                               │      01 / 02 ────────────
 *   │            photo              │      ■ В строительстве · Ботаника
 *   │         (7 columns)           │
 *   │                               │      Botanic Star 2 —
 *   │                               │      блоки 3 и 4
 *   └───────────────────────────────┘      short excerpt
 *                                          СМОТРЕТЬ ПРОЕКТ ──→
 *
 * `reverse` mirrors it (text left, photo right) and sets the text at the top of
 * the frame instead of the bottom, so two rows in a row read as a composition,
 * not a repeated template. The text is inset from the photo (and the portrait
 * frame is a column narrower) on purpose: the offset lets the row breathe.
 *
 * The whole row is one link; the photo zooms slowly on hover via `group`.
 * Below `lg` it stacks: photo at full container width, text underneath.
 */
export function ProjectFeature({
  project,
  locale,
  dict,
  index,
  total,
  reverse = false,
  aspect = reverse ? '4 / 5' : '5 / 4',
  position,
  className,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  /** Zero-based position in the list, printed as "01 / 02". */
  index: number;
  total: number;
  reverse?: boolean;
  aspect?: string;
  /** CSS object-position for the photo. */
  position?: string;
  className?: string;
}) {
  const name = project.name[locale];
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;
  const caption = project.coverKind === 'render' ? dict.design.render : undefined;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Link
      href={routes.project(locale, project.slug)}
      className={cn('group grid grid-cols-1 gap-y-9 md:gap-y-12 lg:grid-cols-12 lg:gap-x-gutter', className)}
    >
      <div
        className={cn(
          'lg:row-start-1',
          // On a tablet the mirrored (portrait) frame keeps to the right two
          // thirds: full width it would stand taller than the screen.
          reverse
            ? 'md:ml-auto md:w-2/3 lg:col-span-6 lg:col-start-7 lg:ml-0 lg:w-auto'
            : 'lg:col-span-7 lg:col-start-1',
        )}
      >
        <Reveal variant="mask">
          <Media
            src={project.cover}
            alt={name}
            aspect={aspect}
            label={name}
            seed={index}
            position={position}
            caption={caption}
            sizes={
              reverse
                ? '(max-width: 767px) 100vw, (max-width: 1023px) 66vw, 50vw'
                : '(max-width: 1023px) 100vw, 58vw'
            }
            zoom
          />
        </Reveal>
      </div>

      {/* Text: five columns with a 12% inset on the photo side. Four plain
          columns are ~6.9em of display-lg — one word short of "Botanic Star
          2 —" — so the inset carries the breathing room instead. */}
      <Reveal
        delay={0.12}
        className={cn(
          'lg:row-start-1 lg:col-span-5',
          reverse
            ? 'lg:col-start-1 lg:self-start lg:pr-[12%] lg:pt-[clamp(2rem,6vw,7rem)]'
            : 'lg:col-start-8 lg:self-end lg:pl-[12%]',
        )}
      >
        <div className="flex items-center gap-5 text-muted" aria-hidden="true">
          <span className="label tabular">
            {pad(index + 1)} / {pad(total)}
          </span>
          <span className="h-px flex-1 bg-line/15" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
          <StatusBadge status={project.status} label={statusLabel} />
          <span aria-hidden="true" className="label">
            ·
          </span>
          <span className="label">{project.district[locale]}</span>
        </div>
        {/* The address gets its own line: appended to the row above it would
            wrap mid-list and strand a separator. */}
        {project.address && <p className="label mt-3 text-muted">{project.address[locale]}</p>}

        <h3 className="mt-8 font-display text-display-lg font-light text-balance text-ink md:mt-10">
          {typesetName(name)}
        </h3>

        <p className="mt-6 max-w-[38ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
          {project.excerpt[locale]}
        </p>

        <ArrowLabel className="mt-10 text-ink md:mt-12">{dict.common.viewProject}</ArrowLabel>
      </Reveal>
    </Link>
  );
}
