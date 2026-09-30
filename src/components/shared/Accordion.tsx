'use client';

import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import type { FaqItem } from '@/content/types';
import { cn } from '@/lib/utils';
import { typo } from '@/lib/text';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * FAQ accordion — hairline rows, a light display question and a thin plus
 * that turns into a cross.
 *
 *   01   Как выбрать квартиру?                                    ＋
 *   ──────────────────────────────────────────────────────────────────
 *
 * The answer opens with a grid-template-rows 0fr → 1fr transition (no measured
 * heights, no JS animation), so the first answer, open by default, is visible
 * in the server HTML. Closed answers stay in the DOM for crawlers but are
 * `inert`, which takes them out of the tab order and the accessibility tree.
 *
 * Keyboard: Enter/Space toggle (native button); ↑/↓ move between questions,
 * Home/End jump to the first/last one.
 *
 * `headingLevel` — the questions' heading level, so the outline stays
 * continuous (h2 right under a page's h1; h3 inside a titled section).
 */
export function Accordion({
  items,
  locale,
  headingLevel = 'h3',
}: {
  items: FaqItem[];
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  const [open, setOpen] = useState<number>(0);
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = items.length - 1;
    const next =
      e.key === 'ArrowDown' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowUp' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    buttons.current[next]?.focus();
  }

  return (
    <div className="border-b border-line/15">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={i} className="border-t border-line/15">
            <Heading>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                // The focus ring is drawn inside the row: the global 4px offset
                // would lay its lower edge across the first line of an open answer.
                className="group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-5 px-3 py-7 text-left focus-visible:outline-offset-[-2px] md:gap-8 md:py-9"
              >
                {/* Decorative index: kept out of the button's accessible name. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'label tabular w-6 shrink-0 pt-[0.7em] transition-colors duration-500 ease-premium md:w-8',
                    isOpen ? 'text-ink' : 'text-muted',
                  )}
                >
                  {pad(i + 1)}
                </span>
                <span className="min-w-0 flex-1 font-display text-display-sm font-light text-balance text-ink">
                  {typo(item.q[locale])}
                </span>
                {/* Thin plus → cross. Two 1px bars; the pair turns 45°. */}
                <span
                  aria-hidden="true"
                  className="-mr-2 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center text-ink transition-colors duration-500 ease-premium group-hover:text-accent-strong"
                >
                  <span
                    className={cn(
                      'relative block h-[18px] w-[18px] transition-transform duration-600 ease-premium',
                      isOpen && 'rotate-45',
                    )}
                  >
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                  </span>
                </span>
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={cn(
                'grid transition-[grid-template-rows] duration-600 ease-premium',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    'max-w-prose pb-9 pl-11 text-pretty text-base leading-relaxed text-muted transition-opacity duration-500 ease-premium md:pb-11 md:pl-16 md:pr-12 md:text-[1.0625rem]',
                    isOpen ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {typo(item.a[locale])}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
