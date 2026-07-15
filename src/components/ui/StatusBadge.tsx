import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/content/types';

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
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur',
        status === 'construction'
          ? 'bg-brand/15 text-brand-700'
          : 'bg-graphite/10 text-graphite',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'construction' ? 'bg-brand animate-pulse' : 'bg-graphite/60',
        )}
      />
      {label}
    </span>
  );
}
