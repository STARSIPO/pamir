import { cn } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Reveal } from './Reveal';

/**
 * Section opener used across the site.
 *
 *   02 — ПРОЕКТЫ ─────────────────────────────────────────   (label + hairline)
 *
 *   Избранные жилые                              short supporting text,
 *   комплексы                                    or an action link
 *
 * `index` is the section number ("02"); `eyebrow` its name. The hairline draws
 * in as the section enters view. The title arrives word by word.
 * `tone="light"` is for the contrast band (text-band-fg).
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  tone = 'dark',
  size = 'xl',
  className,
  as: Heading = 'h2',
  rule = true,
}: {
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned slot beside the title (a link, a button). */
  action?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  size?: 'xl' | 'lg' | 'md';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  rule?: boolean;
}) {
  const light = tone === 'light';
  const muted = light ? 'text-band-muted' : 'text-muted';
  const center = align === 'center';

  return (
    <div className={cn(center && 'text-center', className)}>
      {(eyebrow || index) && (
        <div className={cn('flex items-center gap-4', center && 'justify-center')}>
          <Reveal className={cn('label flex shrink-0 items-center gap-3', muted)}>
            {index && <span className="tabular">{index}</span>}
            {index && eyebrow && <span aria-hidden="true">—</span>}
            {eyebrow && <span>{eyebrow}</span>}
          </Reveal>
          {rule && !center && (
            <span
              aria-hidden="true"
              className={cn('rule-draw h-px flex-1', light ? 'bg-band-fg/15' : 'bg-line/15')}
            />
          )}
        </div>
      )}

      <div
        className={cn(
          'mt-8 flex flex-col gap-8 md:mt-12',
          !center && (subtitle || action) && 'lg:flex-row lg:items-end lg:justify-between lg:gap-16',
        )}
      >
        <Reveal stagger={typeof title === 'string'} className={cn(!center && 'lg:max-w-[16ch] xl:max-w-[18ch]', center && 'mx-auto max-w-[18ch]')}>
          <Heading
            className={cn(
              'font-display font-light text-balance',
              size === 'xl' && 'text-display-xl',
              size === 'lg' && 'text-display-lg',
              size === 'md' && 'text-display-md',
              light ? 'text-band-fg' : 'text-ink',
            )}
          >
            {splitWords(title)}
          </Heading>
        </Reveal>

        {(subtitle || action) && (
          <Reveal delay={0.12} className={cn('flex flex-col gap-6 lg:max-w-sm lg:pb-3', center && 'mx-auto items-center')}>
            {subtitle && <p className={cn('text-pretty text-base leading-relaxed md:text-[1.0625rem]', muted)}>{subtitle}</p>}
            {action}
          </Reveal>
        )}
      </div>
    </div>
  );
}
