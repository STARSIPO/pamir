import type { ApartmentStatus as Status } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';

/**
 * Sales status as a quiet label with a small mark — the site's StatusBadge
 * idiom, extended to the three stock states with the schemes' own language.
 * The three marks differ in shape, not only in colour (stone and warm make
 * the accent and a faint grey hard to tell apart at 8 px):
 *   available — solid accent square
 *   reserved  — hatched square (the schemes hatch reserved units)
 *   sold      — empty hairline square, muted label (the schemes' sold outline)
 */
export function ApartmentStatus({ status, label, className }: { status: Status; label: string; className?: string }) {
  return (
    <span className={cn('label inline-flex items-center gap-2.5', status === 'sold' ? 'text-muted' : 'text-ink', className)}>
      <StatusMark status={status} />
      {label}
    </span>
  );
}

export function StatusMark({ status, className }: { status: Status; className?: string }) {
  if (status === 'reserved') {
    return (
      <svg viewBox="0 0 8 8" aria-hidden="true" className={cn('h-2 w-2 shrink-0 text-ink/70', className)}>
        <rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M0 8 8 0M-2 4 4-2M4 10 10 4" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  if (status === 'sold') {
    return <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 border border-current opacity-60', className)} />;
  }
  return <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 bg-accent', className)} />;
}
