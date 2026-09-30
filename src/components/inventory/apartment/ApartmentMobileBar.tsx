'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Arrow } from '@/components/ui/Button';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const noop = () => () => {};

/**
 * Phones and tablets (below lg): once the buyer has scrolled past the price
 * and its actions (`after`), a slim bar at the bottom keeps the apartment's
 * price and «Оставить заявку» in reach — over the room list and the notes
 * that follow. It never covers the plan, and it steps aside whenever one of
 * the `hideOn` blocks is on screen: the calculator (which has its own bar)
 * and the lead form.
 *
 * Portalled to <body>, so no transformed ancestor turns `fixed` into
 * `absolute`. A visual convenience only — hidden from assistive tech and out
 * of the tab order: the facts card carries the same price and link.
 */
export function ApartmentMobileBar({
  label,
  price,
  action,
  href = '#lead',
  after,
  hideOn,
  apartmentId,
  status,
}: {
  /** «Квартира №43». */
  label: string;
  /** «€88 800». */
  price: string;
  /** «Оставить заявку»; reserved: the short «Узнать о брони» (a phone row has no room for more). */
  action: string;
  href?: string;
  /** Id of the block the bar takes over from once it has scrolled above the screen. */
  after: string;
  /** Ids of the blocks that hide the bar while any of them is on screen. */
  hideOn: string[];
  apartmentId: string;
  status: string;
}) {
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [past, setPast] = useState(false);
  const [covered, setCovered] = useState<Record<string, boolean>>({});
  const ids = hideOn.join(' ');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    // Passed once the price block is gone under the fixed header. Read on
    // scroll, not from an IntersectionObserver: a jump from below the block
    // to above it (or back, «Наверх») crosses no threshold and would leave
    // the state stale.
    const price = document.getElementById(after);
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!price) return;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || 68;
      setPast(price.getBoundingClientRect().bottom < header);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const blocks = ids
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (blocks.length) {
      const io = new IntersectionObserver((entries) =>
        setCovered((prev) => {
          const next = { ...prev };
          for (const e of entries) next[e.target.id] = e.isIntersecting;
          return next;
        }),
      );
      blocks.forEach((el) => io.observe(el));
      observers.push(io);
    }
    return () => {
      observers.forEach((io) => io.disconnect());
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [after, ids]);

  const show = past && !Object.values(covered).some(Boolean);
  if (!client) return null;
  return createPortal(
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 transition-[opacity,transform] duration-500 ease-premium lg:hidden',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
    >
      {/* The caption has the full width to itself, so the apartment number
          is never cut; the price keeps its width (it never shrinks or wraps)
          and the action takes what is left of the row, wrapping — right
          aligned — only if a label ever outgrows it. */}
      <div className="border-t border-band-fg/15 bg-band px-[var(--gutter)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-band-fg">
        <p className="label truncate text-band-muted">{label}</p>
        <div className="mt-1 flex items-center justify-between gap-x-5">
          <p className="shrink-0 whitespace-nowrap font-display text-display-sm font-light tabular">{price}</p>
          {/* 44px tall for the thumb; the negative margin keeps the row at
              the price's height, so the bar stays slim. */}
          <Link
            href={href}
            tabIndex={-1}
            onClick={() => track('lead_open', { source: 'apartment_bar', apartment: apartmentId, status })}
            className="group label -my-2 inline-flex min-h-11 min-w-0 items-center justify-end gap-2.5 text-right text-band-fg"
          >
            <span className="min-w-0 text-balance">
              <span className="link-rule pb-1 [box-decoration-break:clone]">{action}</span>
            </span>
            <Arrow className="w-4" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
