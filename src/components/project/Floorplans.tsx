'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { AvailabilityStatus, Floorplan } from '@/content/types';
import { resolveAvailability } from '@/content/types';
import { Arrow, Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { lockScroll } from '@/lib/smooth-scroll';
import { asset, cn } from '@/lib/utils';

/** Stable anchor for deep-linking a single plan: #plan-<id>. */
const anchorFor = (id: string) => `plan-${id}`;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Plans are presented as drawings, not product cards: a paper plate in a 1px
 * frame, and everything that describes the plan set outside it, underneath —
 * index and sales status, the type in the display face, a hairline table.
 */
export function Floorplans({
  floorplans,
  name,
  locale,
  dict,
}: {
  floorplans: Floorplan[];
  name: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const d = dict.projectDetail;

  // Numeric sort: the default comparator is lexicographic, which orders
  // 1, 10, 2 once a project has ten or more room counts.
  const roomsPresent = useMemo(
    () => Array.from(new Set(floorplans.map((f) => f.rooms))).sort((a, b) => a - b),
    [floorplans],
  );

  const [filter, setFilter] = useState<number | 'all'>('all');
  const [zoomId, setZoomId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? floorplans : floorplans.filter((f) => f.rooms === filter)),
    [filter, floorplans],
  );

  const roomLabel = useCallback(
    (n: number) => {
      if (n <= 0) return d.studio;
      if (n === 1) return d.room1;
      if (n === 2) return d.room2;
      if (n === 3) return d.room3;
      if (n === 4) return d.room4;
      return d.room5plus;
    },
    [d],
  );

  const statusLabel = (s: AvailabilityStatus) =>
    s === 'available' ? d.available : s === 'reserved' ? d.reserved : s === 'sold' ? d.sold : d.statusUnknown;

  // The overlay steps through the *filtered* list, so next/prev matches what
  // the user is looking at rather than the full catalogue.
  const zoomIndex = zoomId ? visible.findIndex((f) => f.id === zoomId) : -1;
  const zoom = zoomIndex >= 0 ? visible[zoomIndex] : null;

  const close = useCallback(() => setZoomId(null), []);
  const step = useCallback(
    (delta: number) => {
      if (zoomIndex < 0 || visible.length === 0) return;
      const next = (zoomIndex + delta + visible.length) % visible.length;
      setZoomId(visible[next].id);
    },
    [zoomIndex, visible],
  );

  // Open the plan named in the URL hash (#plan-<id>) on load and on hashchange.
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash.startsWith('plan-')) return;
      const id = hash.slice('plan-'.length);
      if (floorplans.some((f) => f.id === id)) {
        setFilter('all');
        setZoomId(id);
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [floorplans]);

  return (
    <div>
      {roomsPresent.length > 1 && (
        <div role="group" aria-label={d.floorplansTitle} className="mb-12 flex flex-wrap gap-2 md:mb-16">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
            {dict.design.allProjectsShort}
          </FilterTab>
          {roomsPresent.map((n) => (
            <FilterTab key={n} active={filter === n} onClick={() => setFilter(n)}>
              {roomLabel(n)}
            </FilterTab>
          ))}
        </div>
      )}

      <div className="grid gap-x-gutter gap-y-20 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((f, i) => {
          const status = resolveAvailability(f);
          const title = roomLabel(f.rooms);
          const n = floorplans.indexOf(f) + 1;
          return (
            <article key={f.id} id={anchorFor(f.id)} className="flex scroll-mt-28 flex-col">
              <Reveal delay={(i % 3) * 0.08}>
                <button
                  type="button"
                  onClick={() => setZoomId(f.id)}
                  aria-haspopup="dialog"
                  aria-label={`${d.planDialogTitle} — ${title}`}
                  className="group relative block w-full cursor-zoom-in border border-line/20 bg-surface text-ink transition-colors duration-500 ease-premium hover:border-line/50"
                >
                  <span className="relative block aspect-square">
                    <PlanDrawing
                      plan={f}
                      alt={`${name} — ${title}`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center border border-line/20 text-muted opacity-0 transition-opacity duration-500 ease-premium group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <ExpandGlyph />
                  </span>
                </button>
              </Reveal>

              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="label tabular text-muted">{pad(n)}</span>
                <AvailabilityMark status={status} label={statusLabel(status)} />
              </div>
              <h3 className="mt-4 font-display text-display-md font-light text-balance text-ink">{title}</h3>

              <dl className="mt-6 border-b border-line/15 text-sm">
                <Row label={d.area} value={f.area ? `${f.area} ${d.sqm}` : d.onRequest} />
                <Row label={d.floor} value={f.floor ? f.floor[locale] : d.onRequest} />
              </dl>
              {f.placeholder && <p className="mt-4 text-xs leading-relaxed text-muted">{d.placeholderNote}</p>}

              <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-1 pt-6">
                <Button href="#lead" variant="ghost" arrow className="min-h-11">
                  {d.priceCta}
                </Button>
                <a
                  href="#lead"
                  className="link-line inline-flex min-h-11 items-center text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted transition-colors duration-500 hover:text-ink"
                >
                  {d.leaveRequest}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {zoom && (
        <PlanDialog
          key={zoom.id}
          plan={zoom}
          name={name}
          title={roomLabel(zoom.rooms)}
          dialogTitle={d.planDialogTitle}
          closeLabel={d.close}
          prevLabel={d.prevPlan}
          nextLabel={d.nextPlan}
          position={visible.length > 1 ? `${pad(zoomIndex + 1)} / ${pad(visible.length)}` : null}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </div>
  );
}

/**
 * Full-screen plan viewer.
 *
 * A real dialog: Escape closes it, page scroll (and Lenis) is paused, focus is
 * trapped and restored to the trigger on close, and arrow keys walk the
 * filtered set.
 */
function PlanDialog({
  plan,
  name,
  title,
  dialogTitle,
  closeLabel,
  prevLabel,
  nextLabel,
  position,
  onClose,
  onPrev,
  onNext,
}: {
  plan: Floorplan;
  name: string;
  title: string;
  dialogTitle: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
  position: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;

    // Lock page scroll, compensating for the scrollbar so the page behind does
    // not shift sideways when it disappears.
    const { paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    lockScroll(true);
    closeRef.current?.focus();

    return () => {
      lockScroll(false);
      document.body.style.paddingRight = paddingRight;
      restoreTo?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        onPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        onNext();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${dialogTitle} — ${title}`}
      data-lenis-prevent
      className="fixed inset-0 z-[110] flex flex-col bg-scrim/95 text-white"
      onClick={onClose}
    >
      <div className="container flex h-20 shrink-0 items-center justify-between gap-6 md:h-24">
        <p className="label flex min-w-0 items-center gap-4 text-white/80">
          <span className="truncate">{title}</span>
          {position && (
            <span className="shrink-0 whitespace-nowrap tabular text-white/50" aria-live="polite">
              {position}
            </span>
          )}
        </p>
        <div onClick={(e) => e.stopPropagation()}>
          <CtrlButton ref={closeRef} label={closeLabel} onClick={onClose}>
            <CloseGlyph />
          </CtrlButton>
        </div>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1 items-center justify-center px-[var(--gutter)]',
          !position && 'pb-[var(--gutter)]',
        )}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative aspect-square w-[min(100%,calc(100svh_-_12rem),52rem)] border border-white/15 bg-surface text-ink"
        >
          <PlanDrawing plan={plan} alt={`${name} — ${title}`} sizes="(max-width: 768px) 100vw, 52rem" />
        </div>
      </div>

      {position && (
        <div className="container flex h-20 shrink-0 items-center justify-between gap-6 md:h-24">
          <div onClick={(e) => e.stopPropagation()}>
            <CtrlButton label={prevLabel} onClick={onPrev}>
              <Arrow className="rotate-180 group-hover:-translate-x-1" />
            </CtrlButton>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <CtrlButton label={nextLabel} onClick={onNext}>
              <Arrow />
            </CtrlButton>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The plate's content: the real drawing when there is one, otherwise a
 * schematic line sketch (tagged DEMO, and the card carries the placeholder
 * note) so an unconfirmed plan never reads as a real one.
 */
function PlanDrawing({ plan, alt, sizes }: { plan: Floorplan; alt: string; sizes: string }) {
  if (plan.image) {
    return (
      <Image
        src={asset(plan.image)}
        alt={alt}
        fill
        sizes={sizes}
        className="img-treat object-contain p-[7%]"
      />
    );
  }
  return (
    <span role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center p-[9%]">
      <PlanSketch rooms={plan.rooms} />
      <span className="label absolute bottom-3 right-3 text-muted/70">demo</span>
    </span>
  );
}

/**
 * Schematic plan: façade bays along the top (one per room, each with a
 * window), wet core and entrance on the left, living/kitchen band below.
 * Strokes stay 1px at any size (non-scaling).
 */
function PlanSketch({ rooms }: { rooms: number }) {
  const L = 8, R = 92, T = 12, B = 88; // outer walls
  const core = 32; // right edge of the wet core / entrance strip
  const mid = 56; // wall between the bays and the living band
  const bays = Math.max(1, Math.min(rooms, 4));
  const w = (R - core) / bays;
  const starts = Array.from({ length: bays }, (_, b) => core + w * b);
  const door = Math.min(7, w * 0.4);

  // Mid wall with one door opening per bay.
  let midWall = '';
  let x = core;
  for (const s of starts) {
    midWall += `M${x} ${mid}H${s + 2}`;
    x = s + 2 + door;
  }
  midWall += `M${x} ${mid}H${R}`;

  const swings = starts.map((s) => `M${s + 2} ${mid}V${mid - door}A${door} ${door} 0 0 1 ${s + 2 + door} ${mid}`).join('');
  const windows = starts.map((s) => {
    const ww = Math.min(w * 0.5, 16);
    const cx = s + w / 2;
    return { x: cx - ww / 2, w: ww };
  });

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full text-ink/70" fill="none" aria-hidden="true">
      <g stroke="currentColor" vectorEffect="non-scaling-stroke">
        {/* Outer walls, with the entrance opening on the left. */}
        <path d={`M${L} 44V${T}H${R}V${B}H${L}V52`} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {/* Windows: a break in the wall, glazing drawn as twin lines. */}
        {windows.map((win, i) => (
          <g key={i}>
            <rect x={win.x} y={T - 1.5} width={win.w} height={3} className="fill-surface" stroke="none" />
            <path
              d={`M${win.x} ${T - 1.5}H${win.x + win.w}M${win.x} ${T + 1.5}H${win.x + win.w}M${win.x} ${T - 1.5}V${T + 1.5}M${win.x + win.w} ${T - 1.5}V${T + 1.5}`}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
        {/* Partitions. */}
        <path
          d={`M${core} ${T}V${mid}${starts
            .slice(1)
            .map((s) => `M${s} ${T}V${mid}`)
            .join('')}${midWall}M${L} 34H${core - 10}M${core - 3} 34H${core}`}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
        {rooms >= 3 && <path d={`M70 ${mid}V${B - 16}M70 ${B - 8}V${B}`} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />}
        {/* Door swings. */}
        <path
          d={`${swings}M${core - 10} 34V${34 - 7}A7 7 0 0 1 ${core - 3} 34M${L} 44H${L + 8}A8 8 0 0 1 ${L} 52`}
          strokeWidth={0.75}
          opacity={0.55}
          vectorEffect="non-scaling-stroke"
        />
        {/* Kitchen run along the left wall of the living band. */}
        <path d={`M${L + 7} ${mid + 6}V${B - 6}H${L}`} strokeWidth={0.75} opacity={0.55} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/**
 * Status is carried by shape *and* tone, never by hue alone:
 * available ■ (accent) · reserved ◇ · sold — · unknown □.
 */
function AvailabilityMark({ status, label }: { status: AvailabilityStatus; label: string }) {
  return (
    <span className={cn('label inline-flex shrink-0 items-center gap-2.5', status === 'available' ? 'text-ink' : 'text-muted')}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-block shrink-0',
          status === 'available' && 'h-2 w-2 bg-accent',
          status === 'reserved' && 'h-2 w-2 rotate-45 border border-current',
          status === 'sold' && 'h-px w-3 bg-current',
          status === 'unknown' && 'h-2 w-2 border border-current',
        )}
      />
      {label}
    </span>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'label inline-flex h-11 items-center border px-5 transition-colors duration-500 ease-premium',
        active ? 'border-ink bg-ink text-canvas' : 'border-line/20 text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line/15 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

/** Square hairline control, 48px — thin glyphs, no fills. */
const CtrlButton = forwardRef<HTMLButtonElement, { label: string; onClick: () => void; children: React.ReactNode }>(
  function CtrlButton({ label, onClick, children }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={onClick}
        className="group flex h-12 w-12 shrink-0 items-center justify-center border border-white/20 text-white transition-colors duration-500 ease-premium hover:border-white/70 focus-visible:border-white"
      >
        {children}
      </button>
    );
  },
);

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
