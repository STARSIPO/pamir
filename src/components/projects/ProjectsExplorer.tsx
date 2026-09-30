'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project, ProjectStatus } from '@/content/types';
import { ProjectRow, type RowAvailability } from './ProjectRow';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

type Filter = 'all' | ProjectStatus;

const FILTERS: Filter[] = ['all', 'construction', 'completed'];

/** The outgoing list fades for this long before the new one is swapped in. */
const OUT_MS = 280;

/* ------------------------------------------------------------------
   Layout: one even column. Every project gets a framed row of its own —
   photo on the left cropped to the same frame, text on the right — so the
   catalogue reads as a calm, orderly list (client's request, 2026-09-30).
   Phones stack photo over text inside the same frame.
   ------------------------------------------------------------------ */

/**
 * Intrinsic size (px) of each cover in /public, as scripts/process-photos.mjs
 * prints it. Covers are cropped into their frames with object-cover, so a
 * landscape photo in a narrower frame renders wider than the frame. `sizes`
 * asks for that rendered width, or the browser picks a file that is too
 * small and upscales it. Update an entry when a cover is re-cut.
 */
const COVER_SIZE: Record<string, readonly [w: number, h: number]> = {
  '/photos/projects/botanic-star-2-blocks-3-4/cover-v2.jpg': [1300, 1074],
  '/photos/projects/eco-house/cover.jpg': [1000, 1161],
  '/photos/projects/botanic-star-2-block-2/cover.jpg': [1400, 1018],
  '/photos/projects/botanic-star-2-block-1/cover.jpg': [2000, 924],
  '/photos/projects/botanic-star/cover.jpg': [1200, 1803],
  '/photos/projects/botanic-park/cover-v2.jpg': [1800, 1059],
};

/** Frame shapes: 4:3 on phones; from md about 1.3:1 (5 of 12 columns × the row height). */
const PHONE_FRAME = 4 / 3;
const ROW_FRAME = 1.3;

/** `sizes` for a row photo: the width the cropped cover is drawn at. */
function rowSizes(cover?: string): string {
  const px = cover ? COVER_SIZE[cover] : undefined;
  const aspect = px ? px[0] / px[1] : 16 / 9;
  const k = (frame: number) => Math.max(1, aspect / frame);
  // 5/12 of the container: ≈ 39vw, capped at the 1680px measure.
  return [
    `(min-width: 1680px) ${Math.ceil(650 * k(ROW_FRAME))}px`,
    `(min-width: 768px) ${Math.ceil(40 * k(ROW_FRAME))}vw`,
    `${Math.ceil(92 * k(PHONE_FRAME))}vw`,
  ].join(', ');
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The project catalogue: text tabs over one even column of framed project
 * rows (ProjectRow). Used on /projects (with filters) and on the company
 * page (`showFilters={false}`, completed projects only).
 *
 * Switching a filter fades the current list out, swaps it while invisible,
 * and lets the new one rise in (CSS only). Cards are visible by default —
 * nothing waits on JS to appear.
 */
export function ProjectsExplorer({
  projects,
  locale,
  dict,
  showFilters = true,
  availability = {},
}: {
  projects: Project[];
  locale: Locale;
  dict: Dictionary;
  showFilters?: boolean;
  /** Per-slug availability for projects with an apartment selector (computed on the server). */
  availability?: Record<string, RowAvailability>;
}) {
  const uid = useId();
  const reduce = usePrefersReducedMotion();

  // `filter` is the selected tab (updates at once); `shown` is the list on
  // screen, which follows after the fade-out.
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState<Filter>('all');
  const [leaving, setLeaving] = useState(false);
  const [swaps, setSwaps] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tablist = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const labels: Record<Filter, string> = {
    all: dict.common.filters.all,
    construction: dict.common.filters.construction,
    completed: dict.common.filters.completed,
  };

  const counts = useMemo(
    () => ({
      all: projects.length,
      construction: projects.filter((p) => p.status === 'construction').length,
      completed: projects.filter((p) => p.status === 'completed').length,
    }),
    [projects],
  );

  const visible = useMemo(
    () => (shown === 'all' ? projects : projects.filter((p) => p.status === shown)),
    [shown, projects],
  );

  /*
   * On phones the tab strip scrolls sideways, edge to edge. Each edge fades
   * out only while tabs run past it: the fade grows with the distance still
   * to scroll (up to the gutter plus 1.5rem), so it is gone at either end and
   * never switches abruptly. The widths travel to the mask as --fade-s /
   * --fade-e; before hydration the CSS fallbacks match the resting state
   * (start clean, end faded).
   */
  useEffect(() => {
    const list = tablist.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rest = list.scrollWidth - list.clientWidth - list.scrollLeft;
      const fade = (parseFloat(getComputedStyle(list).paddingLeft) || 0) + 24;
      list.style.setProperty('--fade-s', `${Math.round(Math.min(Math.max(list.scrollLeft, 0), fade))}px`);
      list.style.setProperty('--fade-e', `${Math.round(Math.min(Math.max(rest, 0), fade))}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    list.addEventListener('scroll', schedule, { passive: true });
    // Web fonts and viewport changes move the tab widths.
    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    tabs.current.forEach((t) => t && ro.observe(t));
    return () => {
      list.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [showFilters]);

  /** Centre the chosen tab in the phone strip, so its neighbours peek in from the faded edges. */
  function bringIntoView(i: number) {
    const list = tablist.current;
    const tab = tabs.current[i];
    if (!list || !tab) return;
    const max = list.scrollWidth - list.clientWidth;
    if (max <= 0) return;
    const l = list.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const left = Math.min(max, Math.max(0, list.scrollLeft + t.left + t.width / 2 - (l.left + l.width / 2)));
    if (Math.abs(left - list.scrollLeft) >= 1) list.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
  }

  function select(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    bringIntoView(FILTERS.indexOf(next));
    window.clearTimeout(timer.current);
    if (reduce) {
      setShown(next);
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setShown(next);
      setLeaving(false);
      setSwaps((n) => n + 1);
    }, OUT_MS);
  }

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = FILTERS.indexOf(filter);
    const last = FILTERS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(FILTERS[next]);
    // The strip scrolls itself (smoothly); a focus scroll would cut it short.
    tabs.current[next]?.focus({ preventScroll: true });
  }

  const panelId = `${uid}-panel`;
  const tabId = (f: Filter) => `${uid}-tab-${f}`;

  return (
    <div>
      {showFilters && (
        <div className="relative">
          <div
            ref={tablist}
            role="tablist"
            aria-label={dict.projectsPage.eyebrow}
            onKeyDown={onTabKey}
            className={cn(
              'no-scrollbar -mx-[var(--gutter)] flex gap-x-9 overflow-x-auto px-[var(--gutter)] md:mx-0 md:gap-x-12 md:overflow-visible md:px-0 lg:gap-x-16',
              'max-md:[mask-image:linear-gradient(90deg,transparent,black_var(--fade-s,0px),black_calc(100%_-_var(--fade-e,2.75rem)),transparent)]',
            )}
          >
            {FILTERS.map((f, i) => {
              const active = f === filter;
              return (
                <button
                  key={f}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  id={tabId(f)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={panelId}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(f)}
                  className={cn(
                    'group/tab relative flex min-h-[3.75rem] shrink-0 items-start gap-2.5 pb-5 pt-4 text-left font-display text-display-sm font-light',
                    'transition-colors duration-500 ease-premium max-md:focus-visible:outline-offset-[-2px]',
                    active ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {f === 'all' ? (
                    // Phones get the short form, so the third tab still
                    // peeks into view and the strip reads as scrollable.
                    <>
                      <span className="whitespace-nowrap md:hidden">{dict.design.allProjectsShort}</span>
                      <span className="hidden whitespace-nowrap md:inline">{labels.all}</span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">{labels[f]}</span>
                  )}
                  <span aria-hidden="true" className="label tabular pt-[0.2em]">
                    {pad(counts[f])}
                  </span>
                  <span className="sr-only">({counts[f]})</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 bottom-0 z-[1] h-px origin-left transition-[transform,background-color] duration-500 ease-premium',
                      active
                        ? 'scale-x-100 bg-ink'
                        : 'scale-x-0 bg-line/40 group-hover/tab:scale-x-100',
                    )}
                  />
                </button>
              );
            })}
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line/15" />
        </div>
      )}

      <div
        id={showFilters ? panelId : undefined}
        role={showFilters ? 'tabpanel' : undefined}
        aria-labelledby={showFilters ? tabId(filter) : undefined}
        className={cn(
          'transition-opacity ease-premium',
          showFilters && 'mt-[clamp(3.5rem,7vw,7rem)]',
          leaving ? 'opacity-0 duration-300' : 'opacity-100 duration-500',
        )}
      >
        {visible.length === 0 ? (
          <div className="border-b border-line/15 pb-section-sm pt-4">
            <p className="max-w-[22ch] font-display text-display-md font-light text-balance text-muted">
              {dict.projectsPage.empty}
            </p>
            {showFilters && (
              <Button variant="ghost" arrow onClick={() => select('all')} className="mt-10 min-h-11">
                {dict.common.viewAllProjects}
              </Button>
            )}
          </div>
        ) : (
          <ul
            key={swaps}
            role="list"
            // Rows side by side from md share one height (the tallest), so the
            // frames line up as an even column whatever the text length.
            className={cn('grid grid-cols-1 gap-6 md:auto-rows-fr md:gap-8', swaps > 0 && 'animate-fade-up')}
          >
            {visible.map((p, i) => (
              <li key={p.slug}>
                <ProjectRow
                  project={p}
                  locale={locale}
                  dict={dict}
                  index={i}
                  sizes={rowSizes(p.cover)}
                  priority={showFilters && i < 2}
                  availability={availability[p.slug]}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
