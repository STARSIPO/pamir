'use client';

import { useMemo, useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Floorplan } from '@/content/types';
import { Media } from '@/components/ui/Media';
import { cn } from '@/lib/utils';

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
  const roomsPresent = Array.from(new Set(floorplans.map((f) => f.rooms))).sort();
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [zoom, setZoom] = useState<Floorplan | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? floorplans : floorplans.filter((f) => f.rooms === filter)),
    [filter, floorplans],
  );

  const roomLabel = (n: number) =>
    n === 1 ? dict.projectDetail.room1 : n === 2 ? dict.projectDetail.room2 : dict.projectDetail.room3;

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
        {visible.map((f) => (
          <div key={f.id} className="flex flex-col overflow-hidden rounded-2xl border border-line/12 bg-white">
            <button
              onClick={() => setZoom(f)}
              className="group relative bg-sand"
              aria-label={`${name} — ${roomLabel(f.rooms)}`}
            >
              <Media
                src={f.image}
                alt={`${name} — ${roomLabel(f.rooms)}`}
                aspect="1 / 1"
                seed={f.rooms}
                label={locale === 'ru' ? 'Планировка' : 'Plan'}
                showTag={false}
                imgClassName="object-contain p-4"
              />
              <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink">{roomLabel(f.rooms)}</h3>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    f.available ? 'bg-brand/15 text-brand-700' : 'bg-line/10 text-muted',
                  )}
                >
                  {f.available ? dict.projectDetail.available : dict.projectDetail.onRequest}
                </span>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm text-muted">
                <Row label={dict.projectDetail.area} value={f.area ? `${f.area} м²` : dict.projectDetail.onRequest} />
                <Row label={dict.projectDetail.floor} value={f.floor ? f.floor[locale] : dict.projectDetail.onRequest} />
              </dl>
              {f.placeholder && (
                <p className="mt-3 text-xs text-muted/70">{dict.projectDetail.placeholderNote}</p>
              )}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <a
                  href="#lead"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-graphite-900 transition-colors hover:bg-brand-600"
                >
                  {dict.projectDetail.priceCta}
                </a>
                <a
                  href="#lead"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  {dict.projectDetail.leaveRequest}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {zoom && (
          <div
            className="fixed inset-0 z-[110] flex flex-col bg-graphite-900/95 backdrop-blur"
            onClick={() => setZoom(null)}
          >
            <div className="flex items-center justify-between px-5 py-4 text-white/70">
              <span className="text-sm">{roomLabel(zoom.rooms)}</span>
              <button onClick={() => setZoom(null)} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center px-4 pb-10" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-2xl rounded-xl bg-white p-4">
                <Media
                  src={zoom.image}
                  alt={`${name} — ${roomLabel(zoom.rooms)}`}
                  aspect="1 / 1"
                  seed={zoom.rooms}
                  label={locale === 'ru' ? 'Планировка' : 'Plan'}
                  showTag={false}
                  imgClassName="object-contain"
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        )}
    </div>
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
