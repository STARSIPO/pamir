import { cn } from '@/lib/utils';

/**
 * Shown on every inventory view while `inventory.demo` (or pricing.demo) is
 * true: the numbers are invented and a buyer must not take them as stock.
 * Quiet, but always visible — never dismissible.
 *
 * The accent stays in the hairline border and a small square mark; the badge
 * text itself is ink (small caps in the accent colour fail AA on warm).
 */
export function DemoNotice({
  badge,
  text,
  className,
  id,
}: {
  badge: string;
  text: string;
  className?: string;
  /** Anchor for a link to the notice (SelectorShell's phone mark). */
  id?: string;
}) {
  return (
    <p
      id={id}
      role="note"
      className={cn(
        'flex flex-col gap-2 border border-accent/40 px-4 py-3 text-sm leading-relaxed text-muted sm:flex-row sm:items-baseline sm:gap-4',
        className,
      )}
    >
      <span className="label shrink-0 text-ink">
        <span aria-hidden="true" className="mr-2.5 inline-block h-1.5 w-1.5 bg-accent align-middle" />
        {badge}
      </span>
      <span className="text-pretty">{text}</span>
    </p>
  );
}

/**
 * The notice's one-line mark:  ■ ДЕМО-ДАННЫЕ ↓
 *
 * For a layout that moves the full notice off the first screen (SelectorShell
 * on a phone): the mark stays at the top, so the data are never shown
 * unflagged, and links down to the notice (`href="#<DemoNotice id>"`). The
 * link's hit area is 44 px tall; negative margins give the padding back, so
 * the mark adds no height to the row it sits in.
 */
export function DemoMark({ badge, href, className }: { badge: string; href: string; className?: string }) {
  return (
    <a href={href} className={cn('group label -my-4 inline-flex items-center py-4 text-ink', className)}>
      <span aria-hidden="true" className="mr-2.5 inline-block h-1.5 w-1.5 shrink-0 bg-accent" />
      <span className="link-line">{badge}</span>
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="ml-2 h-2.5 w-2.5 shrink-0 text-muted">
        <path d="M6 1v9.5M2 6.5l4 4 4-4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </a>
  );
}
