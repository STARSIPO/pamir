import { cn } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'dark',
  className,
  as: Heading = 'h2',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <span className={cn('eyebrow', align === 'center' && 'justify-center')}>{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.05} stagger={typeof title === 'string'}>
        <Heading
          className={cn(
            'mt-5 font-display text-display-lg font-semibold text-balance',
            tone === 'light' ? 'text-white' : 'text-ink',
          )}
        >
          {splitWords(title)}
        </Heading>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              'mt-5 max-w-2xl text-lg leading-relaxed text-pretty',
              align === 'center' && 'mx-auto',
              tone === 'light' ? 'text-white/70' : 'text-muted',
            )}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}
