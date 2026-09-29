import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/content/types';

/**
 * Project status as a quiet label with a small square — not a pill. Under
 * construction gets the accent; completed stays neutral. Colour follows
 * `currentColor` for the text, so it sits on canvas, band or photos alike.
 */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectStatus;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn('label inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5', status === 'construction' ? 'bg-accent' : 'bg-current opacity-50')}
      />
      {label}
    </span>
  );
}
