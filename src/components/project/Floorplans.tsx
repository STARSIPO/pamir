'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { AvailabilityStatus, Floorplan } from '@/content/types';
import { resolveAvailability } from '@/content/types';
import { Media } from '@/components/ui/Media';
import { cn } from '@/lib/utils';

/** Stable anchor for deep-linking a single plan: #plan-<id>. */
const anchorFor = (id: string) => `plan-${id}`;

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
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            {dict.common.filters.all}
          </FilterPill>
          {roomsPresent.map((n) => (
            <FilterPill key={n} active={filter === n} onClick={() => setFilter(n)}>
              {roomLabel(n)}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((f) => {
          const status = resolveAvailability(f);
          return (
            <div
              key={f.id}
              id={anchorFor(f.id)}
              className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-line/12 bg-white"
            >
              <button
                onClick={() => setZoomId(f.id)}
                className="group relative bg-sand"
                aria-label={`${name} — ${roomLabel(f.rooms)}`}
              >
                <Media
                  src={f.image}
                  alt={`${name} — ${roomLabel(f.rooms)}`}
                  aspect="1 / 1"
                  seed={f.rooms}
                  label={d.planLabel}
                  showTag={false}
                  imgClassName="object-contain p-4"
                />
                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-4 w-4" />
                </span>
              </button>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-ink">{roomLabel(f.rooms)}</h3>
                  <AvailabilityChip status={status} label={statusLabel(status)} />
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-muted">
                  <Row
                    label={d.area}
                    value={f.area ? `${f.area} ${d.sqm}` : d.onRequest}
                  />
                  <Row label={d.floor} value={f.floor ? f.floor[locale] : d.onRequest} />
                </dl>
                {f.placeholder && <p className="mt-3 text-xs text-muted/70">{d.placeholderNote}</p>}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="#lead"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-graphite-900 transition-colors hover:bg-brand-600"
                  >
                    {d.priceCta}
                  </a>
                  <a
                    href="#lead"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink"
                  >
                    {d.leaveRequest}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {zoom && (
        <PlanDialog
          key={zoom.id}
          plan={zoom}
          name={name}
          title={roomLabel(zoom.rooms)}
          planLabel={d.planLabel}
          dialogTitle={d.planDialogTitle}
          closeLabel={d.close}
          prevLabel={d.prevPlan}
          nextLabel={d.nextPlan}
          position={visible.length > 1 ? `${zoomIndex + 1} / ${visible.length}` : null}
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
 * A real dialog: Escape closes it, body scroll is locked, focus is trapped and
 * restored to the trigger on close, and arrow keys walk the filtered set.
 */
function PlanDialog({
  plan,
  name,
  title,
  planLabel,
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
  planLabel: string;
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
    closeRef.current?.focus();

    // Lock body scroll, compensating for the scrollbar so the page behind does
    // not shift sideways when it disappears.
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

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
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreTo?.focus?.();
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${dialogTitle} — ${title}`}
      className="fixed inset-0 z-[110] flex flex-col bg-graphite-900/95 backdrop-blur"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 text-white/70">
        <span className="text-sm">
          {title}
          {position && <span className="ml-3 text-white/40">{position}</span>}
        </span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onPrev}
            aria-label={prevLabel}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={onNext}
            aria-label={nextLabel}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl rounded-xl bg-white p-4">
          <Media
            src={plan.image}
            alt={`${name} — ${title}`}
            aspect="1 / 1"
            seed={plan.rooms}
            label={planLabel}
            showTag={false}
            imgClassName="object-contain"
            sizes="100vw"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Status is carried by tone *and* shape, never by hue alone, and never by
 * knocking a colour back with alpha — graphite at low alpha on white lands
 * around 2.3:1 and fails WCAG 2.2 1.4.11 (3:1 for non-text graphics).
 */
function AvailabilityChip({ status, label }: { status: AvailabilityStatus; label: string }) {
  const tone =
    status === 'available'
      ? 'bg-brand/15 text-brand-700'
      : status === 'reserved'
        ? 'bg-stone text-ink'
        : status === 'sold'
          ? 'bg-graphite text-white'
          : 'bg-sand text-muted';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5',
          status === 'available' ? 'rounded-full bg-brand' : null,
          status === 'reserved' ? 'rotate-45 bg-ink/70' : null,
          status === 'sold' ? 'h-px w-2.5 bg-white/80' : null,
          status === 'unknown' ? 'rounded-full border border-muted/60' : null,
        )}
      />
      {label}
    </span>
  );
}

function FilterPill({
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
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active ? 'border-ink bg-ink text-white' : 'border-line/20 text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/8 pb-1.5">
      <dt>{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
