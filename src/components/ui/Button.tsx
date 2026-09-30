import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Buttons are rectangles with a tracked uppercase label and a thin arrow.
 * No radius, no shadow — the hover is a fill change and a 4px arrow shift.
 *
 *  primary       solid ink → accent on hover. The one strong action per view.
 *  outline       hairline border → fills with ink on hover.
 *  ghost         text + arrow with a standing underline. Secondary actions.
 *  inverse       for the dark band (CTA, footer): solid band-fg.
 *  light         on photographs: solid white, near-black (scrim) label.
 *  outlineLight  on photographs: white hairline.
 */
type Variant = 'primary' | 'outline' | 'ghost' | 'inverse' | 'light' | 'outlineLight';
type Size = 'md' | 'lg';

// Focus uses the site-wide :focus-visible outline (globals.css): 2px, 4px
// clear of the button, accent on light grounds and white over photographs.
// A ring with a transparent offset painted a solid 5px slab instead.
const base =
  'group relative inline-flex items-center justify-center gap-3 whitespace-nowrap text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-[background-color,color,border-color] duration-500 ease-premium disabled:pointer-events-none disabled:opacity-50';

// Hovers fill with accent-strong: the 12px uppercase label keeps AA on it in
// every theme (warm white on the plain accent was 3.65:1). On dark grounds
// globals.css re-points accent-strong / on-accent to a light fill + dark text.
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:bg-accent-strong hover:text-on-accent',
  outline: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-canvas',
  ghost: 'text-ink',
  inverse: 'bg-band-fg text-band hover:bg-accent-strong hover:text-on-accent',
  light: 'bg-white text-scrim hover:bg-accent-strong hover:text-on-accent focus-visible:outline-white',
  outlineLight:
    'border border-white/40 text-white hover:border-white hover:bg-white hover:text-scrim focus-visible:outline-white',
};

const sizes: Record<Size, string> = {
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

/** Thin long arrow, drawn to sit on the label's x-height. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 12"
      fill="none"
      aria-hidden="true"
      className={cn(
        'h-3 w-6 shrink-0 transition-transform duration-500 ease-premium group-hover:translate-x-1',
        className,
      )}
    >
      <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button(props: ButtonProps | AnchorProps) {
  const { variant = 'primary', size = 'md', arrow = false, className, children } = props;
  const ghost = variant === 'ghost';
  // Ghost keeps its text-only look but a 44px tap height (touch target).
  const classes = cn(base, variants[variant], !ghost && sizes[size], ghost && 'min-h-11 px-0 py-1', className);

  const inner = (
    <>
      <span className={cn(ghost && 'link-rule pb-1')}>{children}</span>
      {arrow && <Arrow />}
    </>
  );

  if ('href' in props && props.href !== undefined) {
    const { href, variant: _v, size: _s, arrow: _a, className: _c, children: _ch, ...rest } =
      props as AnchorProps;
    const external = /^(https?:|tel:|mailto:)/.test(href);
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
          {...rest}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }

  const { variant: _v, size: _s, arrow: _a, className: _c, children: _ch, ...rest } =
    props as ButtonProps;
  return (
    <button className={classes} {...rest}>
      {inner}
    </button>
  );
}

/**
 * The "View project →" line used inside cards. Not a link itself — the card is
 * the link — so it renders a span and reacts to the card's `group` hover.
 */
export function ArrowLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.14em]',
        className,
      )}
    >
      <span className="link-rule pb-1">{children}</span>
      <Arrow />
    </span>
  );
}
