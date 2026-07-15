import { cn } from '@/lib/utils';

/**
 * Pamir Construct logo, rebuilt as crisp SVG from the original raster mark:
 * a green "Pamir peak" (mountain/shield) enclosing a city skyline — the meaning
 * is preserved (Pamir = mountains, Construct = the city being built).
 * The green mark is constant; the wordmark inherits `currentColor` so it works
 * on both light and dark headers.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 44"
      className={cn('h-9 w-auto', className)}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M21.9 5.6a2.4 2.4 0 0 1 4.2 0l16.5 28.9a2.4 2.4 0 0 1-2.1 3.6H7.5a2.4 2.4 0 0 1-2.1-3.6L21.9 5.6Z"
        fill="rgb(124 193 43)"
      />
      {/* city skyline inside the peak */}
      <g fill="#ffffff">
        <rect x="15.6" y="28.4" width="3" height="6.4" rx="0.3" />
        <rect x="19.4" y="24.2" width="3.4" height="10.6" rx="0.3" />
        <rect x="23.6" y="20.6" width="3.4" height="14.2" rx="0.3" />
        <rect x="27.8" y="26" width="3" height="8.8" rx="0.3" />
        <rect x="24.7" y="17.4" width="1.2" height="3.4" rx="0.4" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[1.18rem] font-extrabold uppercase tracking-tight">
            Pamir
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-current/70">
            Construct
          </span>
        </span>
      )}
    </span>
  );
}
