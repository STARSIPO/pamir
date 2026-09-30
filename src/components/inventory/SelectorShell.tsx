import Link from 'next/link';
import { cn } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { DemoMark, DemoNotice } from './DemoNotice';

export type SelectorStep = 'building' | 'floor' | 'apartment';

const ORDER: SelectorStep[] = ['building', 'floor', 'apartment'];

/**
 * Accessible names of the shell's two navigation aids, from the dictionary
 * (`dict.inventory.common`). Optional so existing callers keep compiling; an
 * absent name is simply not set (never an English fallback).
 */
export interface SelectorShellA11y {
  /** Name of the breadcrumb <nav>: «Навигационная цепочка». */
  breadcrumbs?: string;
  /** Name of the step list: «Шаги подбора». */
  steps?: string;
}

/** Anchor of the phone placement of the demo notice (one shell per page). */
const DEMO_ID = 'selector-demo';

/**
 * Frame shared by every step of the apartment selector and the apartment page:
 * breadcrumbs, a large light title, the three-step indicator and the demo
 * notice. The step content (scheme, elevation, plan) is `children`.
 *
 *   ПРОЕКТЫ / BOTANIC STAR 2 / БЛОК 3 / ЭТАЖ 7
 *   Выберите этаж                         01 Корпус — 02 Этаж — 03 Квартира
 *   [demo notice]
 *   [step content]
 *
 * Phones open on the scheme. Below `md` the full demo notice moves under the
 * step content, and a one-line mark beside the eyebrow (■ ДЕМО-ДАННЫЕ ↓, a
 * link down to it) keeps the data flagged on the first screen at no extra
 * height; the vertical rhythm is tighter too. From `md` up the notice stays
 * between the title and the content. Target at 390 × 844: the first zone of
 * each scheme above y ≈ 600 (the content itself must not open with a tall
 * toolbar for that).
 *
 * Below `sm` the step indicator keeps only the current step's name beside the
 * numbers (01 — 02 — 03 КВАРТИРА); the other names stay in the accessibility
 * tree. That keeps the row on one line in both languages at 390 px, and the
 * title grid is `minmax(0, 1fr)` so nothing can widen the page.
 */
export function SelectorShell({
  crumbs,
  eyebrow,
  title,
  lead,
  step,
  stepLabels,
  stepHrefs = {},
  demo,
  aside,
  a11y,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  step: SelectorStep;
  stepLabels: Record<SelectorStep, string>;
  /** Links back to completed steps. */
  stepHrefs?: Partial<Record<SelectorStep, string>>;
  demo?: { badge: string; text: string } | null;
  /** Right-hand slot beside the title (stats, a secondary action). */
  aside?: React.ReactNode;
  a11y?: SelectorShellA11y;
  children: React.ReactNode;
}) {
  const current = ORDER.indexOf(step);
  return (
    <section className="bg-canvas text-ink">
      <Container className="pb-section pt-6 md:pt-12">
        <Breadcrumbs items={crumbs} label={a11y?.breadcrumbs} />

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 md:mt-12 md:gap-8 lg:grid-cols-12 lg:items-end lg:gap-gutter">
          <div className="min-w-0 lg:col-span-7">
            {(eyebrow || demo) && (
              // Phones: the eyebrow shares its line with the demo mark (the
              // mark wraps under a long eyebrow). md+: the eyebrow alone.
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-x-6 gap-y-3',
                  !eyebrow && 'md:hidden',
                )}
              >
                {eyebrow && <Reveal className="label min-w-0 text-muted">{eyebrow}</Reveal>}
                {demo && <DemoMark badge={demo.badge} href={`#${DEMO_ID}`} className="md:hidden" />}
              </div>
            )}
            <Reveal stagger className={cn(eyebrow ? 'mt-4 md:mt-5' : demo && 'max-md:mt-4')}>
              <h1 className="font-display text-display-lg font-light text-balance">{splitWords(title)}</h1>
            </Reveal>
            {lead && (
              <Reveal delay={0.1}>
                <div className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted md:mt-5 md:text-[1.0625rem]">
                  {lead}
                </div>
              </Reveal>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:col-span-5 lg:items-end">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3" aria-label={a11y?.steps}>
              {ORDER.map((s, i) => {
                const done = i < current;
                const active = i === current;
                const content = (
                  <>
                    <span className="tabular">{String(i + 1).padStart(2, '0')}</span>
                    {/* Phones: only the current step is named on screen. */}
                    <span className={cn(!active && 'sr-only sm:not-sr-only')}>{stepLabels[s]}</span>
                  </>
                );
                return (
                  <li key={s} className="flex items-center gap-2 sm:gap-3">
                    {done && stepHrefs[s] ? (
                      <Link
                        href={stepHrefs[s]!}
                        className="label flex min-h-11 min-w-11 items-center justify-center gap-2 text-muted transition-colors duration-300 ease-premium hover:text-ink sm:justify-start"
                      >
                        {content}
                      </Link>
                    ) : (
                      <span
                        aria-current={active ? 'step' : undefined}
                        className={cn('label flex min-h-11 items-center gap-2', active ? 'text-ink' : 'text-muted')}
                      >
                        {content}
                      </span>
                    )}
                    {i < ORDER.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn('h-px w-5 sm:w-10', i < current ? 'bg-accent' : 'bg-line/20')}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            {aside}
          </div>
        </div>

        {demo && <DemoNotice badge={demo.badge} text={demo.text} className="max-md:hidden md:mt-10" />}

        <div className="mt-6 md:mt-14">{children}</div>

        {/* Phones: the full notice after the step content (see the mark above). */}
        {demo && <DemoNotice id={DEMO_ID} badge={demo.badge} text={demo.text} className="mt-12 md:hidden" />}
      </Container>
    </section>
  );
}
