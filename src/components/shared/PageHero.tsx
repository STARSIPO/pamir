import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';

/** Compact hero for inner pages (sits below the solid header). */
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
  tone?: 'sand' | 'dark';
  children?: React.ReactNode;
}) {
  return (
    <section className={cn('relative', tone === 'dark' ? 'bg-graphite-900 text-white' : 'bg-sand')}>
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          {eyebrow && (
            <Reveal>
              <span className="eyebrow">{eyebrow}</span>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <h1
              className={cn(
                'mt-5 font-display text-display-xl font-semibold text-balance',
                tone === 'dark' ? 'text-white' : 'text-ink',
              )}
            >
              {title}
            </h1>
          </Reveal>
          {subtitle && (
            <Reveal delay={0.1}>
              <p
                className={cn(
                  'mt-5 max-w-2xl text-lg leading-relaxed text-pretty',
                  tone === 'dark' ? 'text-white/70' : 'text-muted',
                )}
              >
                {subtitle}
              </p>
            </Reveal>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
