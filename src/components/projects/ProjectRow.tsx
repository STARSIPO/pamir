import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { summarySpecs } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { typo, typesetName } from '@/lib/text';
import { formatEUR } from '@/lib/pricing/engine';
import { Media } from '@/components/ui/Media';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLabel } from '@/components/ui/Button';

/** Availability line for projects that have an apartment selector. */
export interface RowAvailability {
  available: number;
  priceFrom: number | null;
}

/**
 * One project in the catalogue: a framed row with a place of its own.
 *
 *   ┌───────────────────────┬──────────────────────────────────────────┐
 *   │                       │ 01            ■ В строительстве · Ботаника │
 *   │   photo, 4:3 crop     │ Botanic Star 2 — блоки 3 и 4               │
 *   │                       │ excerpt                                   │
 *   │                       │ Класс ─ Отопление ─ Парковка               │
 *   │                       │ Свободно 65 · от €64 700    Смотреть →    │
 *   └───────────────────────┴──────────────────────────────────────────┘
 *
 * Every photo is cropped to the same frame, so the column reads as one even
 * list. The whole frame is the link; hover warms the hairline and slowly
 * zooms the photo. Phones stack photo over text inside the same frame.
 */
export function ProjectRow({
  project,
  locale,
  dict,
  index,
  sizes,
  priority = false,
  availability,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  index: number;
  sizes: string;
  priority?: boolean;
  availability?: RowAvailability;
}) {
  const name = project.name[locale];
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;
  const specs = summarySpecs(project, 3);
  const caption = project.coverKind === 'render' ? dict.design.render : undefined;
  const common = dict.inventory.common;

  return (
    <Link
      href={routes.project(locale, project.slug)}
      className="group grid h-full border border-line/15 transition-colors duration-500 ease-premium hover:border-accent/60 focus-visible:border-accent md:grid-cols-12"
    >
      {/* Phones: a 4:3 frame. From md the photo fills the row's height, so
          every row is one even rectangle whatever the text length. */}
      <div className="relative aspect-[4/3] md:col-span-5 md:aspect-auto md:min-h-full">
        <Media
          src={project.cover}
          alt=""
          fill
          position={project.coverPosition}
          sizes={sizes}
          priority={priority}
          caption={caption}
          label={name}
          seed={index}
          zoom
        />
      </div>

      <div className="flex flex-col gap-8 p-6 sm:p-8 md:col-span-7 md:min-h-[clamp(20rem,30vw,28rem)] lg:p-10 xl:p-12">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-muted">
          <span className="label tabular">{String(index + 1).padStart(2, '0')}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={project.status} label={statusLabel} />
            <span aria-hidden="true" className="label">
              ·
            </span>
            <span className="label">{project.district[locale]}</span>
          </span>
        </div>

        <div>
          <h3 className="font-display text-display-md font-light text-balance text-ink">{typesetName(name)}</h3>
          <p className="mt-4 max-w-[54ch] text-pretty text-base leading-relaxed text-muted">
            {typo(project.excerpt[locale])}
          </p>
        </div>

        {specs.length > 0 && (
          <dl className="grid grid-cols-1 border-t border-line/15 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.key} className="flex items-baseline justify-between gap-4 border-b border-line/15 py-3 sm:block sm:border-b-0 sm:py-4 sm:pr-4">
                <dt className="label text-muted">{s.label[locale]}</dt>
                <dd className="text-[0.9375rem] text-ink sm:mt-2">{s.value[locale]}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          {availability ? (
            <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
              <span>
                {common.available} <span className="tabular text-ink">{availability.available}</span>
              </span>
              {availability.priceFrom !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {common.from} <span className="tabular text-ink">{formatEUR(availability.priceFrom, locale)}</span>
                  </span>
                </>
              )}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <ArrowLabel className="text-ink">{dict.common.viewProject}</ArrowLabel>
        </div>
      </div>
    </Link>
  );
}
