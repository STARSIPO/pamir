import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Проекты / Botanic Star 2 / Блок 3 / Этаж 7 / Квартира 34
 * The last crumb is the current page. Scrolls horizontally on narrow screens
 * rather than wrapping into a ragged block.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('no-scrollbar -mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)]', className)}>
      <ol className="label flex min-w-max items-center gap-3 text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-3">
              {c.href && !last ? (
                <Link href={c.href} className="link-line inline-flex min-h-11 items-center transition-colors hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('inline-flex min-h-11 items-center', last && 'text-ink')}>
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-muted/60">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
