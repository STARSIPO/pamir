'use client';

import { formatEUR } from '@/lib/pricing/engine';
import { cn } from '@/lib/utils';
import { useTweenedNumber } from './hooks';

/**
 * A euro amount that glides to a new value over ~0.7s instead of jumping.
 *
 * No layout shift: the final value, laid out but transparent, holds the
 * width while the moving figure is drawn over it (as in ui/Counter). Assistive
 * tech reads the final value only; the moving copy is aria-hidden. Digits are
 * tabular, so the figure does not jitter while it runs.
 */
export function AnimatedAmount({
  value,
  locale,
  className,
  align = 'left',
}: {
  value: number;
  locale: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  const shown = Math.round(useTweenedNumber(value));
  const moving = shown !== value;
  return (
    <span className={cn('relative inline-block whitespace-nowrap tabular', className)}>
      <span className={cn(moving && 'opacity-0')}>{formatEUR(value, locale)}</span>
      {moving && (
        <span aria-hidden="true" className={cn('absolute top-0', align === 'right' ? 'right-0' : 'left-0')}>
          {formatEUR(shown, locale)}
        </span>
      )}
    </span>
  );
}
