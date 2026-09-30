import Link from 'next/link';
import { cn } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { DemoNotice } from './DemoNotice';

export type SelectorStep = 'building' | 'floor' | 'apartment';

const ORDER: SelectorStep[] = ['building', 'floor', 'apartment'];

/**
 * Frame shared by every step of the apartment selector and the apartment page:
 * breadcrumbs, a large light title, the three-step indicator and the demo
 * notice. The step content (scheme, elevation, plan) is `children`.
 *
 *   ПРОЕКТЫ / BOTANIC STAR 2 / БЛОК 3 / ЭТАЖ 7
 *   Выберите этаж                         01 Корпус — 02 Этаж — 03 Квартира
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
  children: React.ReactNode;
}) {
  const current = ORDER.indexOf(step);
  return (
    <section className="bg-canvas text-ink">
      <Container className="pb-section pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:items-end lg:gap-gutter">
          <div className="lg:col-span-7">
            {eyebrow && <Reveal className="label text-muted">{eyebrow}</Reveal>}
            <Reveal stagger className={cn(eyebrow && 'mt-5')}>
              <h1 className="font-display text-display-lg font-light text-balance">{splitWords(title)}</h1>
            </Reveal>
            {lead && (
              <Reveal delay={0.1}>
                <div className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">{lead}</div>
              </Reveal>
            )}
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5 lg:items-end">
            <ol className="flex items-center gap-3" aria-label={stepLabels.building + ' → ' + stepLabels.apartment}>
              {ORDER.map((s, i) => {
                const done = i < current;
                const active = i === current;
                const content = (
                  <>
                    <span className="tabular">{String(i + 1).padStart(2, '0')}</span>
                    <span>{stepLabels[s]}</span>
                  </>
                );
                return (
                  <li key={s} className="flex items-center gap-3">
                    {done && stepHrefs[s] ? (
                      <Link href={stepHrefs[s]!} className="label flex min-h-11 items-center gap-2 text-muted transition-colors hover:text-ink">
                        {content}
                      </Link>
                    ) : (
                      <span
                        aria-current={active ? 'step' : undefined}
                        className={cn('label flex min-h-11 items-center gap-2', active ? 'text-ink' : 'text-muted/60')}
                      >
                        {content}
                      </span>
                    )}
                    {i < ORDER.length - 1 && (
                      <span aria-hidden="true" className={cn('h-px w-6 sm:w-10', i < current ? 'bg-accent' : 'bg-line/20')} />
                    )}
                  </li>
                );
              })}
            </ol>
            {aside}
          </div>
        </div>

        {demo && <DemoNotice badge={demo.badge} text={demo.text} className="mt-8 md:mt-10" />}

        <div className="mt-10 md:mt-14">{children}</div>
      </Container>
    </section>
  );
}
