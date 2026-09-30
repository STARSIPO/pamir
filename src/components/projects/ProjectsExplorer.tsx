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
type Slot = {
  place: string;
  /** `--card-ratio` per breakpoint. Must match `crop`. */
  ratio: string;
  size: 'md' | 'lg';
  /** Frame width on phones, tablets (md) and desktops (lg) in vw, then in px once the container stops growing at 1680px. */
  width: readonly [phone: number, tablet: number, desktop: number, cap: number];
  /** The same ratios as `ratio`, as numbers (w / h), on phones, tablets and desktops. */
  crop: readonly [phone: number, tablet: number, desktop: number];
};

// Measured off the 12-column grid: 12 cols ≈ 92vw, 9 ≈ 69vw at md; at lg
// 7 cols ≈ 52vw, 6 ≈ 44vw, 5 ≈ 36vw (rounded up, so the 3.5% hover zoom
// never runs out of pixels).
const WIDE = [92, 92, 52, 880] as const;
const NARROW = [92, 69, 36, 620] as const;
const HALF = [92, 69, 44, 760] as const;
const FULL = [92, 92, 92, 1540] as const;

/**
 * Intrinsic size (px) of each cover in /public, as scripts/process-photos.mjs
 * prints it. Covers are cropped into their frames with object-cover, so a
 * landscape photo in a portrait frame renders far wider than the frame: a
 * 2000×924 panorama in a 4/5 frame is 2.7× the frame's width. `sizes` has to
 * ask for that rendered width, or the browser picks a file that is too small
 * and upscales it. Update an entry when a cover is re-cut.
 */
const COVER_SIZE: Record<string, readonly [w: number, h: number]> = {
  '/photos/projects/botanic-star-2-blocks-3-4/cover-v2.jpg': [1300, 1074],
  '/photos/projects/eco-house/cover.jpg': [1000, 1161],
  '/photos/projects/botanic-star-2-block-2/cover.jpg': [1400, 1018],
  '/photos/projects/botanic-star-2-block-1/cover.jpg': [2000, 924],
  '/photos/projects/botanic-star/cover.jpg': [1200, 1803],
  '/photos/projects/botanic-park/cover-v2.jpg': [1800, 1059],
};

/**
 * An unmeasured cover is assumed to be a wide landscape: asking too much only
 * costs bytes (the optimizer never enlarges past the source), asking too
 * little costs sharpness.
 */
const UNKNOWN_COVER_ASPECT = 16 / 9;

/** `sizes` for a cover in a slot: the width the cropped photo is drawn at. */
function sizesFor(slot: Slot, cover?: string): string {
  const px = cover ? COVER_SIZE[cover] : undefined;
  const aspect = px ? px[0] / px[1] : UNKNOWN_COVER_ASPECT;
  // How many times wider than its frame the photo is drawn.
  const k = (frame: number) => Math.max(1, aspect / frame);
  const [phone, tablet, desktop, cap] = slot.width;
  const [onPhone, onTablet, onDesktop] = slot.crop;
  const steps: [query: string, size: string][] = [
    ['(min-width: 1680px) ', `${Math.ceil(cap * k(onDesktop))}px`],
    ['(min-width: 1024px) ', `${Math.ceil(desktop * k(onDesktop))}vw`],
    ['(min-width: 768px) ', `${Math.ceil(tablet * k(onTablet))}vw`],
    ['', `${Math.ceil(phone * k(onPhone))}vw`],
  ];
  return steps
    .filter(([, size], i) => i === steps.length - 1 || size !== steps[i + 1][1])
    .map(([query, size]) => query + size)
    .join(', ');
}

// A 5-column card is too narrow on desktop for ProjectCard's side-by-side
// name + "view project" row: stack them, like a caption under a print.
const STACKED = 'lg:[&_a>div:last-child]:flex-col lg:[&_a>div:last-child]:items-start lg:[&_a>div:last-child]:gap-6';

const SLOTS = {
  aWide: {
    place: 'md:col-span-12 lg:col-span-7 lg:col-start-1',
    ratio: '[--card-ratio:1/1] md:[--card-ratio:4/3] lg:[--card-ratio:5/4]',
    crop: [1, 4 / 3, 5 / 4],
    size: 'lg',
    width: WIDE,
  },
  aNarrow: {
    place: `md:col-span-9 md:col-start-4 lg:col-span-5 lg:col-start-8 lg:mt-[36%] ${STACKED}`,
    ratio: '[--card-ratio:4/5]',
    crop: [4 / 5, 4 / 5, 4 / 5],
    size: 'md',
    width: NARROW,
  },
  bNarrow: {
    place: `md:col-span-9 md:col-start-1 lg:col-span-5 lg:col-start-1 ${STACKED}`,
    ratio: '[--card-ratio:4/5] lg:[--card-ratio:3/4]',
    crop: [4 / 5, 4 / 5, 3 / 4],
    size: 'md',
    width: NARROW,
  },
  bWide: {
    place: 'md:col-span-12 lg:col-span-7 lg:col-start-6 lg:mt-[30%]',
    ratio: '[--card-ratio:1/1] md:[--card-ratio:4/3] lg:[--card-ratio:5/4]',
    crop: [1, 4 / 3, 5 / 4],
    size: 'lg',
    width: WIDE,
  },
  cLeft: {
    place: 'md:col-span-9 md:col-start-1 lg:col-span-6 lg:col-start-1',
    ratio: '[--card-ratio:4/5]',
    crop: [4 / 5, 4 / 5, 4 / 5],
    size: 'md',
    width: HALF,
  },
  cRight: {
    // 4/5 beside 1/1 at equal widths: dropping the square by 25% of its
    // width lands both photos on the same bottom edge.
    place: 'md:col-span-9 md:col-start-4 lg:col-span-6 lg:col-start-7 lg:mt-[25%]',
    ratio: '[--card-ratio:1/1]',
    crop: [1, 1, 1],
    size: 'md',
    width: HALF,
  },
  full: {
    place: 'md:col-span-12',
    ratio: '[--card-ratio:4/5] md:[--card-ratio:4/3] lg:[--card-ratio:16/9]',
    crop: [4 / 5, 4 / 3, 16 / 9],
    size: 'lg',
    width: FULL,
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
                    sizes={sizesFor(slot, p.cover)}
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
