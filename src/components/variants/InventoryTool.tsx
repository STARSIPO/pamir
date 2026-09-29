'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * DIRECTION 03 — the only client boundary in the "Инвентарь" homepage.
 *
 * Everything this component renders is handed to it pre-localized and
 * pre-formatted by InventoryHome (a Server Component): numbers arrive as
 * strings already run through Intl on the server, so there is no locale/ICU
 * drift between the HTML and the hydrated tree, and no dictionary or content
 * module is pulled into the client bundle.
 *
 * The component owns exactly four pieces of state: the hovered unit, the
 * pinned (clicked) unit, the rooms filter and the status filter.
 */

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export interface ToolUnit {
  id: string;
  floor: number;
  rooms: number;
  status: UnitStatus;
  /** Accessible name, e.g. "кв. 74, этаж 7, 2 комн., 58 м², Доступна". */
  name: string;
  /** Pre-formatted display values for the side panel. */
  numberLabel: string;
  floorLabel: string;
  roomsLabel: string;
  areaTotal: string;
  areaLiving: string;
  orientation: string;
  statusLabel: string;
  price: string;
}

export interface ToolFloor {
  floor: number;
  units: ToolUnit[];
}

export interface ToolRow {
  label: string;
  value: string;
}

export interface ToolLabels {
  /** Accessible name for the elevation grid. */
  facade: string;
  /** Left rail header, e.g. "Этаж". */
  floor: string;
  /** Ground-floor plinth, e.g. "Коммерция". */
  commercial: string;
  legend: string;
  filterRooms: string;
  filterStatus: string;
  all: string;
  selection: string;
  summary: string;
  statuses: Record<UnitStatus, string>;
  rows: {
    rooms: string;
    areaTotal: string;
    areaLiving: string;
    orientation: string;
    status: string;
    price: string;
  };
}

/**
 * STATUS ENCODING — tone AND texture, never hue alone, and never a knocked-down
 * alpha of the same swatch. Each cell also carries a dark hairline so the
 * non-text graphic clears 3:1 against the white tool surface (WCAG 2.2 1.4.11)
 * — solid brand green on white is only ~2.1:1 on its own.
 */
const SURFACE: Record<UnitStatus, string> = {
  available: 'border-graphite-900/55 bg-brand',
  reserved: 'border-graphite-900/55 bg-white',
  sold: 'border-graphite-900/70 bg-graphite',
  unknown: 'border-dashed border-graphite/70 bg-sand',
};

/** 45° hatch for `reserved`: mid tone, unmistakable texture, no transparency. */
const HATCH = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgb(var(--graphite-900)) 0 2px, rgb(255 255 255) 2px 6px)',
};

function surfaceStyle(status: UnitStatus) {
  return status === 'reserved' ? HATCH : undefined;
}

const ROOM_FILTERS = [1, 2, 3] as const;
const STATUS_FILTERS: UnitStatus[] = ['available', 'reserved', 'sold'];

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-label transition-colors duration-300 ease-premium',
        active
          ? 'border-graphite-900 bg-graphite-900 text-white'
          : 'border-line/25 bg-white text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function InventoryTool({
  columns,
  floors,
  ground,
  labels,
  summary,
}: {
  /** One weight per position, proportional to that column's total area. */
  columns: number[];
  /** Residential floors, top floor first. */
  floors: ToolFloor[];
  /** Ground floor is commercial space, not apartments. */
  ground: boolean;
  labels: ToolLabels;
  /** Block summary shown while nothing is selected — never an empty shell. */
  summary: ToolRow[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [rooms, setRooms] = useState<number>(0);
  const [status, setStatus] = useState<UnitStatus | 'all'>('all');

  const activeId = hovered ?? pinned;
  const active =
    activeId === null
      ? null
      : (floors.flatMap((f) => f.units).find((u) => u.id === activeId) ?? null);

  const matches = (u: ToolUnit) =>
    (rooms === 0 || u.rooms === rooms) && (status === 'all' || u.status === status);

  const rail = '1.75rem';
  const template = `${rail} ${columns.map((w) => `minmax(0,${w}fr)`).join(' ')}`;

  const clearHover = (id: string) => setHovered((h) => (h === id ? null : h));

  return (
    <div className="bg-white p-4 shadow-card sm:p-6 lg:p-8">
      {/* ---------- FILTERS: dim, never remove — the building keeps its shape. */}
      <div className="flex flex-col gap-4 border-b border-line/15 pb-5 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
        <div role="group" aria-label={labels.filterRooms}>
          <span className="block text-[0.65rem] font-semibold uppercase tracking-label text-muted">
            {labels.filterRooms}
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Pill active={rooms === 0} onClick={() => setRooms(0)}>
              {labels.all}
            </Pill>
            {ROOM_FILTERS.map((r) => (
              <Pill key={r} active={rooms === r} onClick={() => setRooms(r)}>
                <span className="tabular">{r}</span>
              </Pill>
            ))}
          </div>
        </div>

        <div role="group" aria-label={labels.filterStatus}>
          <span className="block text-[0.65rem] font-semibold uppercase tracking-label text-muted">
            {labels.filterStatus}
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Pill active={status === 'all'} onClick={() => setStatus('all')}>
              {labels.all}
            </Pill>
            {STATUS_FILTERS.map((s) => (
              <Pill key={s} active={status === s} onClick={() => setStatus(s)}>
                {labels.statuses[s]}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-8">
        {/* ---------- THE FAÇADE: schematic elevation drawn from the data. */}
        <div>
          <span className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-label text-muted">
            {labels.floor}
          </span>
          <div
            role="group"
            aria-label={labels.facade}
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: template }}
          >
            {floors.map((f) => (
              <div key={f.floor} className="contents">
                <span
                  className="tabular flex items-center justify-end pr-1.5 text-[0.62rem] font-semibold text-muted"
                  aria-hidden="true"
                >
                  {f.floor}
                </span>
                {f.units.map((u) => {
                  const ok = matches(u);
                  const isActive = activeId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      aria-label={u.name}
                      aria-pressed={pinned === u.id}
                      onMouseEnter={() => setHovered(u.id)}
                      onMouseLeave={() => clearHover(u.id)}
                      onFocus={() => setHovered(u.id)}
                      onBlur={() => clearHover(u.id)}
                      onClick={() => setPinned((p) => (p === u.id ? null : u.id))}
                      className={cn(
                        'h-7 border transition-opacity duration-300 ease-premium sm:h-8 lg:h-9',
                        SURFACE[u.status],
                        !ok && 'opacity-20',
                        isActive && 'relative z-10 ring-2 ring-ink ring-offset-1 ring-offset-white',
                      )}
                      style={surfaceStyle(u.status)}
                    />
                  );
                })}
              </div>
            ))}

            {ground && (
              <div className="contents">
                <span
                  className="tabular flex items-center justify-end pr-1.5 text-[0.62rem] font-semibold text-muted"
                  aria-hidden="true"
                >
                  1
                </span>
                <div
                  style={{ gridColumn: `span ${columns.length}` }}
                  className={cn(
                    'flex h-8 items-center justify-center overflow-hidden border px-2 text-[0.58rem] font-semibold uppercase tracking-label text-graphite sm:h-10 sm:text-[0.62rem]',
                    SURFACE.unknown,
                  )}
                >
                  <span className="truncate">{labels.commercial}</span>
                </div>
              </div>
            )}
          </div>

          {/* ---------- GROUND LINE under the building. */}
          <span aria-hidden="true" className="mt-[3px] block h-[2px] w-full bg-graphite" />
          <span
            aria-hidden="true"
            className="mt-[3px] block h-px w-full bg-graphite/25"
          />

          {/* ---------- LEGEND: neither reference site has one. */}
          <div className="mt-6 border-t border-line/15 pt-5">
            <span className="block text-[0.65rem] font-semibold uppercase tracking-label text-muted">
              {labels.legend}
            </span>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2.5">
              {(['available', 'reserved', 'sold', 'unknown'] as UnitStatus[]).map((s) => (
                <li key={s} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn('block h-3.5 w-6 shrink-0 border', SURFACE[s])}
                    style={surfaceStyle(s)}
                  />
                  <span className="text-xs text-ink">{labels.statuses[s]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- SIDE PANEL: the selection, or the block summary. */}
        <aside
          aria-live="polite"
          className="self-start border-t border-line/15 pt-5 lg:sticky lg:top-28 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
        >
          <span className="block text-[0.65rem] font-semibold uppercase tracking-label text-muted">
            {active ? labels.selection : labels.summary}
          </span>

          {active ? (
            <>
              <p className="mt-3 font-display text-display-md font-bold leading-none tracking-[-0.03em] text-ink">
                <span className="tabular">{active.numberLabel}</span>
              </p>
              <p className="mt-2 text-xs uppercase tracking-label text-muted">
                <span className="tabular">{active.floorLabel}</span>
              </p>
              <dl className="mt-5 divide-y divide-line/15 border-t border-line/15">
                <Row label={labels.rows.rooms} value={active.roomsLabel} />
                <Row label={labels.rows.areaTotal} value={active.areaTotal} />
                <Row label={labels.rows.areaLiving} value={active.areaLiving} />
                <Row label={labels.rows.orientation} value={active.orientation} />
                <Row label={labels.rows.status} value={active.statusLabel} />
                <Row label={labels.rows.price} value={active.price} />
              </dl>
            </>
          ) : (
            <dl className="mt-3 divide-y divide-line/15 border-t border-line/15">
              {summary.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} />
              ))}
            </dl>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
