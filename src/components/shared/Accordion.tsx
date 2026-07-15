'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { FaqItem } from '@/content/types';
import { cn } from '@/lib/utils';

/** FAQ accordion. Expand/collapse via a CSS grid-rows transition (no JS-driven
 *  height animation), so the default-open answer is always visible. */
export function Accordion({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="divide-y divide-line/12 border-y border-line/12">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-lg font-semibold text-ink sm:text-xl">{item.q[locale]}</span>
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                  isOpen ? 'rotate-45 border-brand bg-brand text-graphite-900' : 'border-line/25 text-ink',
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-500 ease-premium',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-prose pb-6 leading-relaxed text-muted">{item.a[locale]}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
