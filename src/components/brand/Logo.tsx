import { cn } from '@/lib/utils';

/**
 * Pamir Construct logo.
 *
 * The mark keeps the original idea — a Pamir peak with the city being built
 * inside it — but is drawn as a single-colour glyph: the skyline is knocked
 * out of the peak (evenodd holes), so the whole logo follows `currentColor` and
 * works on every theme and over photographs without a second version.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 44"
      className={cn('h-8 w-auto', className)}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* One path, evenodd: the skyline rectangles are holes in the peak. No
          mask or id, so any number of logos can share a page. */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M22.3 4.9a2 2 0 0 1 3.4 0l17.3 30.3a2 2 0 0 1-1.7 3H6.7a2 2 0 0 1-1.7-3L22.3 4.9Z M15.6 28.4h3v6.4h-3z M19.4 24.2h3.4v10.6h-3.4z M23.6 20.6h3.4v14.2h-3.4z M27.8 26h3v8.8h-3z M24.7 17.4h1.2v3.2h-1.2z"
      />
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
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col font-display leading-none">
          <span className="text-[1.05rem] font-medium uppercase tracking-[0.28em]">Pamir</span>
          <span className="mt-1 text-[0.56rem] font-normal uppercase tracking-[0.42em] opacity-70">
            Construct
          </span>
        </span>
      )}
    </span>
  );
}
