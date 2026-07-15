import { cn } from '@/lib/utils';
import { Container } from './Container';

type Tone = 'default' | 'sand' | 'dark' | 'graphite';

const toneClass: Record<Tone, string> = {
  default: 'bg-white text-ink',
  sand: 'bg-sand text-ink',
  dark: 'bg-graphite-900 text-white',
  graphite: 'bg-graphite text-white',
};

export function Section({
  tone = 'default',
  className,
  containerClassName,
  children,
  id,
  bleed = false,
}: {
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  id?: string;
  /** When true, render children without the inner Container (full-bleed). */
  bleed?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn('relative py-20 sm:py-24 lg:py-32', toneClass[tone], className)}
    >
      {bleed ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}
