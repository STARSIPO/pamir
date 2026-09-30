import { cn } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';
import { Reveal } from './Reveal';

/**
 * Line measure per size, in `ch` of the heading's own display size (so it
 * scales with the clamp()). Roughly 17–21 characters a line: a headline sets
 * in two or three balanced lines, never one word per line.
 */
const measure = {
  xl: 'lg:max-w-[16ch] xl:max-w-[18ch]',
  lg: 'lg:max-w-[20ch]',
  md: 'lg:max-w-[24ch]',
} as const;

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
        {/* The measure sits on the heading itself: `ch` resolves against the
            element's own font size, so on the 16px wrapper 16ch was ~180px
            and a display headline broke one word per line. */}
        <Reveal stagger={typeof title === 'string'} className={cn(!center && 'lg:min-w-0 lg:flex-1')}>
          <Heading
            className={cn(
              'font-display font-light text-balance',
              size === 'xl' && 'text-display-xl',
              size === 'lg' && 'text-display-lg',
              size === 'md' && 'text-display-md',
              !center && measure[size],
              center && 'mx-auto max-w-[18ch]',
              light ? 'text-band-fg' : 'text-ink',
            )}
          >
            {splitWords(title)}
          </Heading>
        </Reveal>

        {(subtitle || action) && (
          <Reveal
            delay={0.12}
            className={cn('flex flex-col gap-6 lg:max-w-xs lg:shrink-0 lg:pb-3 xl:max-w-sm', center && 'mx-auto items-center')}
          >
            {subtitle && <p className={cn('text-pretty text-base leading-relaxed md:text-[1.0625rem]', muted)}>{typeof subtitle === 'string' ? typo(subtitle) : subtitle}</p>}
            {action}
          </Reveal>
        )}
      </div>
    </div>
  );
}
