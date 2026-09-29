import { cn } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Opening block for inner pages (below the solid header). Typography only:
 * a label row with a hairline, a very large light title, and a short lead
 * set to the right on wide screens. `children` lands under the lead (filters,
 * a button).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  tone = 'sand',
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** 'dark' renders on the contrast band. */
  tone?: 'sand' | 'dark';
  children?: React.ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <section className={cn('relative', dark ? 'bg-band text-band-fg' : 'bg-canvas text-ink')}>
      <Container className="pb-section-sm pt-[clamp(3.5rem,8vw,7.5rem)]">
        {eyebrow && (
          <div className="flex items-center gap-4">
            <Reveal className={cn('label shrink-0', dark ? 'text-band-muted' : 'text-muted')}>{eyebrow}</Reveal>
            <span aria-hidden="true" className={cn('rule-draw h-px flex-1', dark ? 'bg-band-fg/15' : 'bg-line/15')} />
          </div>
        )}
        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-gutter">
          <Reveal stagger className="lg:col-span-8">
            <h1 className="font-display text-display-xl font-light text-balance">{splitWords(title)}</h1>
          </Reveal>
          {(subtitle || children) && (
            <Reveal delay={0.12} className="lg:col-span-4 lg:pb-3">
              {subtitle && (
                <p className={cn('max-w-md text-pretty text-base leading-relaxed md:text-[1.0625rem]', dark ? 'text-band-muted' : 'text-muted')}>
                  {subtitle}
                </p>
              )}
              {children && <div className={cn(subtitle && 'mt-8')}>{children}</div>}
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
