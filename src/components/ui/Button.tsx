import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'light' | 'outlineLight';
type Size = 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-premium focus-visible:outline-none disabled:opacity-60 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-graphite-900 hover:bg-brand-600 hover:shadow-float',
  outline: 'border border-line/25 text-ink hover:border-ink hover:bg-ink hover:text-white',
  ghost: 'text-ink hover:text-brand-700',
  light: 'bg-white text-graphite-900 hover:bg-stone',
  outlineLight: 'border border-white/30 text-white hover:bg-white hover:text-graphite-900',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-[0.95rem]',
};

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
  const classes = cn(base, variants[variant], sizes[size], className);

  const inner = (
    <>
      {children}
      {arrow && (
        <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:translate-x-1" />
      )}
    </>
  );

  if ('href' in props && props.href !== undefined) {
    const { href, variant: _v, size: _s, arrow: _a, className: _c, children: _ch, ...rest } =
      props as AnchorProps;
    const external = href.startsWith('http');
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
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
