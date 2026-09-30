import type { ApartmentStatus } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';

const ORDER: ApartmentStatus[] = ['available', 'reserved', 'sold'];

/**
 * Key to the status colours, drawn with the very marks the floor plan uses
 * (docs/INVENTORY.md §8):
 *   available — accent wash, accent-strong line (≥ 3:1 on the wash)
 *   reserved  — ink hatch on a faint ink ground
 *   sold      — no wash, only the walls; not selectable
 *
 * `variant="bar"` keys the thin availability bars of the floor list instead.
 * No ids, no hooks: renders on the server or inside any client component.
 */
export function StatusLegend({
  labels,
  counts,
  variant = 'plan',
  className,
}: {
  labels: Record<ApartmentStatus, string>;
  counts?: Partial<Record<ApartmentStatus, number>>;
  variant?: 'plan' | 'bar';
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
      {ORDER.map((s) => (
        <li key={s} className="label flex items-center gap-2.5 text-muted">
          {variant === 'plan' ? <PlanSwatch status={s} /> : <BarSwatch status={s} />}
          <span>{labels[s]}</span>
          {counts?.[s] !== undefined && <span className="tabular text-ink">{counts[s]}</span>}
        </li>
      ))}
    </ul>
  );
}

function PlanSwatch({ status }: { status: ApartmentStatus }) {
  return (
    <svg viewBox="0 0 16 12" aria-hidden="true" className="h-3 w-4 shrink-0 overflow-visible">
      {status === 'available' && (
        <rect x="0.5" y="0.5" width="15" height="11" className="fill-accent/20 stroke-accent-strong" strokeWidth="1" />
      )}
      {status === 'reserved' && (
        <>
          <rect x="0.5" y="0.5" width="15" height="11" className="fill-ink/5 stroke-ink/30" strokeWidth="1" />
          <path d="M1 7.5 6.5 2M4 11 13 2M9.5 11 15 5.5" className="stroke-ink/40" strokeWidth="1" />
        </>
      )}
      {status === 'sold' && <rect x="0.5" y="0.5" width="15" height="11" fill="none" className="stroke-ink/40" strokeWidth="1" />}
    </svg>
  );
}

/** Colours of a floor-list availability bar segment. */
export const barTone: Record<ApartmentStatus, string> = {
  available: 'bg-accent',
  reserved: 'bg-ink/30',
  sold: 'bg-ink/10',
};

function BarSwatch({ status }: { status: ApartmentStatus }) {
  return <span aria-hidden="true" className={cn('h-[3px] w-4 shrink-0', barTone[status])} />;
}
