'use client';

import { cn } from '@/lib/utils';

/**
 * Touch info bar: after the first tap on an elevation storey or a plan zone,
 * this bar slides up from the bottom edge with the selection's key numbers
 * and one explicit action ("Открыть план этажа", "Подробнее"). Only ever
 * opened by touch input, so desktop never sees it.
 *
 * Closed, it is off-screen and `inert` (no focus, not read out).
 */
export function FloorInfoBar({
  open,
  label,
  closeLabel,
  onClose,
  action,
  children,
}: {
  open: boolean;
  /** Region name for assistive tech. */
  label: string;
  closeLabel: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line/15 bg-surface text-ink transition-transform duration-500 ease-premium',
        open ? 'translate-y-0' : 'translate-y-full',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:gap-8 sm:py-5">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div aria-live="polite" className="min-w-0 flex-1">
            {children}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink sm:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        {action && <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="hidden h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink sm:flex"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="none">
      <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
