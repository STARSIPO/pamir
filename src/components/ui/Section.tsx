import { cn } from '@/lib/utils';
import { Container } from './Container';

/**
 * Page section. Tones are theme roles, never colours:
 *   canvas  — the page background (default)
 *   alt     — secondary background, used sparingly to group a band of content
 *   surface — raised plane (white in the light themes)
 *   band    — the contrast band: CTA and footer
 * Legacy tone names from the first design map onto these.
 */
type Tone = 'canvas' | 'alt' | 'surface' | 'band' | 'default' | 'sand' | 'stone' | 'dark' | 'graphite';

const toneClass: Record<Tone, string> = {
  canvas: 'bg-canvas text-ink',
  alt: 'bg-canvas-alt text-ink',
  surface: 'bg-surface text-ink',
  band: 'bg-band text-band-fg',
  default: 'bg-canvas text-ink',
  sand: 'bg-canvas text-ink',
  stone: 'bg-canvas-alt text-ink',
  dark: 'bg-band text-band-fg',
  graphite: 'bg-band text-band-fg',
};

const spacingClass = {
  default: 'py-section',
  sm: 'py-section-sm',
  none: '',
} as const;

export function Section({
  tone = 'canvas',
  spacing = 'default',
  className,
  containerClassName,
  children,
  id,
  bleed = false,
  ...rest
}: {
  tone?: Tone;
  spacing?: keyof typeof spacingClass;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  id?: string;
  /** When true, render children without the inner Container (full-bleed). */
  bleed?: boolean;
} & Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'className' | 'id'>) {
  return (
    <section id={id} className={cn('relative', spacingClass[spacing], toneClass[tone], className)} {...rest}>
      {bleed ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}
