'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project, ProjectStatus } from '@/content/types';
import { ProjectCard } from './ProjectCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

type Filter = 'all' | ProjectStatus;

const FILTERS: Filter[] = ['all', 'construction', 'completed'];

/** The outgoing list fades for this long before the new one is swapped in. */
const OUT_MS = 280;

/* ------------------------------------------------------------------
   Layout rhythm

   Projects are laid out as a curated sequence, not a uniform grid. On
   desktop (lg) they pair up in rows that cycle through three figures, and
   in every row the right-hand card sits lower — one calm, staggered
   rhythm down the page, with the voids between rows kept even:

     A   ┌────────────┐                 wide 7 cols, landscape
         │            │  ┌───────┐      narrow 5 cols, portrait, set lower
         └────────────┘  │       │
                         └───────┘
     B   ┌───────┐                      mirrored: narrow portrait left,
         │       │  ┌────────────┐     wide landscape right, set lower
         │       │  │            │
         └───────┘  └────────────┘
     C   ┌─────────┐ ┌─────────┐       a pair of equals: the right frame is
         │         │ │         │       shorter and set lower by exactly the
         │         │ └─────────┘       difference, so both photos end on one
         └─────────┘                    line
     —   an odd last project runs the full width.

   On tablets (md) the same sequence becomes a single column that swings
   between full width and a 9-column frame set left or right; on phones
   every card takes the full measure. Frame ratios are breakpoint-specific,
   so they travel to ProjectCard as a CSS variable (`--card-ratio`) instead
   of a fixed prop value. Percentage margins resolve against the card's own
   grid-area width, which keeps the offsets proportional at every width.
   ------------------------------------------------------------------ */
type Slot = { place: string; ratio: string; size: 'md' | 'lg'; sizes: string };

const WIDE_SIZES = '(min-width: 1680px) 880px, (min-width: 1024px) 56vw, 92vw';
const NARROW_SIZES = '(min-width: 1680px) 620px, (min-width: 1024px) 40vw, (min-width: 768px) 70vw, 92vw';
const HALF_SIZES = '(min-width: 1680px) 760px, (min-width: 1024px) 47vw, (min-width: 768px) 70vw, 92vw';
const FULL_SIZES = '(min-width: 1680px) 1540px, 92vw';

// A 5-column card is too narrow on desktop for ProjectCard's side-by-side
// name + "view project" row: stack them, like a caption under a print.
const STACKED = 'lg:[&_a>div:last-child]:flex-col lg:[&_a>div:last-child]:items-start lg:[&_a>div:last-child]:gap-6';

const SLOTS = {
  aWide: {
    place: 'md:col-span-12 lg:col-span-7 lg:col-start-1',
    ratio: '[--card-ratio:1/1] md:[--card-ratio:4/3] lg:[--card-ratio:5/4]',
    size: 'lg',
    sizes: WIDE_SIZES,
  },
  aNarrow: {
    place: `md:col-span-9 md:col-start-4 lg:col-span-5 lg:col-start-8 lg:mt-[36%] ${STACKED}`,
    ratio: '[--card-ratio:4/5]',
    size: 'md',
    sizes: NARROW_SIZES,
  },
  bNarrow: {
    place: `md:col-span-9 md:col-start-1 lg:col-span-5 lg:col-start-1 ${STACKED}`,
    ratio: '[--card-ratio:4/5] lg:[--card-ratio:3/4]',
    size: 'md',
    sizes: NARROW_SIZES,
  },
  bWide: {
    place: 'md:col-span-12 lg:col-span-7 lg:col-start-6 lg:mt-[30%]',
    ratio: '[--card-ratio:1/1] md:[--card-ratio:4/3] lg:[--card-ratio:5/4]',
    size: 'lg',
    sizes: WIDE_SIZES,
  },
  cLeft: {
    place: 'md:col-span-9 md:col-start-1 lg:col-span-6 lg:col-start-1',
    ratio: '[--card-ratio:4/5]',
    size: 'md',
    sizes: HALF_SIZES,
  },
  cRight: {
    // 4/5 beside 1/1 at equal widths: dropping the square by 25% of its
    // width lands both photos on the same bottom edge.
    place: 'md:col-span-9 md:col-start-4 lg:col-span-6 lg:col-start-7 lg:mt-[25%]',
    ratio: '[--card-ratio:1/1]',
    size: 'md',
    sizes: HALF_SIZES,
  },
  full: {
    place: 'md:col-span-12',
    ratio: '[--card-ratio:4/5] md:[--card-ratio:4/3] lg:[--card-ratio:16/9]',
    size: 'lg',
    sizes: FULL_SIZES,
  },
} satisfies Record<string, Slot>;

function slotFor(i: number, total: number): Slot {
  if (total % 2 === 1 && i === total - 1) return SLOTS.full;
  const second = i % 2 === 1;
  switch (Math.floor(i / 2) % 3) {
    case 0:
      return second ? SLOTS.aNarrow : SLOTS.aWide;
    case 1:
      return second ? SLOTS.bWide : SLOTS.bNarrow;
    default:
      return second ? SLOTS.cRight : SLOTS.cLeft;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The project catalogue: text tabs over an asymmetric, editorial sequence of
 * large ProjectCards. Used on /projects (with filters) and on the company
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
}: {
  projects: Project[];
  locale: Locale;
  dict: Dictionary;
  showFilters?: boolean;
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

  /** On phones the tab strip scrolls sideways: keep the chosen tab in view. */
  function bringIntoView(i: number) {
    const list = tablist.current;
    const tab = tabs.current[i];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
    const l = list.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const dx =
      t.right > l.right - pad ? t.right - (l.right - pad)
      : t.left < l.left + pad ? t.left - (l.left + pad)
      : 0;
    if (dx) list.scrollBy({ left: dx, behavior: reduce ? 'auto' : 'smooth' });
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
    tabs.current[next]?.focus();
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
            className="no-scrollbar -mx-[var(--gutter)] flex gap-x-9 overflow-x-auto px-[var(--gutter)] md:mx-0 md:gap-x-12 md:overflow-visible md:px-0 lg:gap-x-16"
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
            className={cn(
              'grid grid-cols-1 gap-y-[clamp(4.5rem,9vw,8.5rem)] md:grid-cols-12 md:gap-x-gutter lg:gap-x-[clamp(2.5rem,4.5vw,5.5rem)]',
              swaps > 0 && 'animate-fade-up',
            )}
          >
            {visible.map((p, i) => {
              const slot = slotFor(i, visible.length);
              return (
                <li
                  key={p.slug}
                  // Big names shrink one step on phones, where a single
                  // column should read as one calm list.
                  className={cn(slot.place, slot.ratio, 'max-md:[&_h3]:text-display-md')}
                >
                  <ProjectCard
                    project={p}
                    locale={locale}
                    dict={dict}
                    index={i}
                    aspect="var(--card-ratio, 4 / 5)"
                    size={slot.size}
                    sizes={slot.sizes}
                    priority={showFilters && i < 2}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
