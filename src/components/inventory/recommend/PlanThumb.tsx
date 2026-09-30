import type { ApartmentPlan2D, Polygon } from '@/lib/inventory/types';
import { cn } from '@/lib/utils';

const points = (p: Polygon) => p.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * A small line drawing of an apartment's 2D plan for result cards: rooms as
 * hairlines, walls (the heated outline) heavier, balcony / terrace dashed.
 * Colour is `currentColor` — set it on the parent (`text-ink/70`). Inside a
 * `group` link the rooms take a faint accent wash on hover.
 * Decorative: the card around it carries the text.
 */
export function PlanThumb({ plan, className }: { plan: ApartmentPlan2D; className?: string }) {
  const [w, h] = plan.size;
  const pad = 0.3;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cn('block h-full w-full', className)}
    >
      {plan.rooms.map((r) => {
        const outdoor = r.type === 'balcony' || r.type === 'terrace';
        return (
          <polygon
            key={r.id}
            points={points(r.polygon)}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            strokeDasharray={outdoor ? '3 3' : undefined}
            className={cn(
              'stroke-current transition-[fill] duration-500 ease-premium',
              outdoor ? 'fill-transparent opacity-70' : 'fill-accent/0 group-hover:fill-accent/10',
            )}
          />
        );
      })}
      <polygon
        points={points(plan.outline)}
        vectorEffect="non-scaling-stroke"
        strokeWidth={2}
        className="fill-none stroke-current"
      />
    </svg>
  );
}
