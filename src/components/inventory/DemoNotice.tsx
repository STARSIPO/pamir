import { cn } from '@/lib/utils';

/**
 * Shown on every inventory view while `inventory.demo` (or pricing.demo) is
 * true: the numbers are invented and a buyer must not take them as stock.
 * Quiet, but always visible — never dismissible.
 */
export function DemoNotice({ badge, text, className }: { badge: string; text: string; className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        'flex flex-col gap-2 border border-accent/40 px-4 py-3 text-sm leading-relaxed text-muted sm:flex-row sm:items-baseline sm:gap-4',
        className,
      )}
    >
      <span className="label shrink-0 text-accent">{badge}</span>
      <span className="text-pretty">{text}</span>
    </p>
  );
}
