import { cn } from '@/lib/utils';

/**
 * A quiet row of key figures beside a step title — label over a light,
 * tabular value, split by hairlines:  ЭТАЖНОСТЬ 10 | СВОБОДНО 28 | ЦЕНА ОТ €58 900
 */
export function FloorStats({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl className={cn('flex flex-wrap gap-x-7 gap-y-5 lg:justify-end', className)}>
      {items.map((it, i) => (
        <div key={it.label} className={cn('min-w-0', i > 0 && 'sm:border-l sm:border-line/15 sm:pl-7')}>
          <dt className="label text-muted">{it.label}</dt>
          <dd className="mt-2 whitespace-nowrap font-display text-display-sm font-light tabular text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
