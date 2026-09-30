import { cn } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';
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
        {/* 7/5 below xl, 8/4 from xl: at 1024 four columns (~300px) set the
            lead in five ragged lines beside a title that filled half its
            eight. The lead starts on column 8, then 9 — the same line as the
            SectionHeading asides. */}
        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-gutter">
          <Reveal stagger className="lg:col-span-7 xl:col-span-8">
            {/* On phones the title sets in three lines at 40px: 0.96 leading
                let RO comma-below accents (ș, ț) touch the capitals under
                them. From sm it fits in two and keeps the tight leading. */}
            <h1 className="font-display text-display-xl font-light text-balance max-sm:leading-[1.04]">
              {splitWords(title)}
            </h1>
          </Reveal>
          {(subtitle || children) && (
            <Reveal delay={0.12} className="lg:col-span-5 lg:col-start-8 lg:pb-3 xl:col-span-4 xl:col-start-9">
              {subtitle && (
                <p className={cn('max-w-md text-pretty text-base leading-relaxed md:text-[1.0625rem]', dark ? 'text-band-muted' : 'text-muted')}>
                  {typo(subtitle)}
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
