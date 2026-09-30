import Image from 'next/image';
import { asset, cn } from '@/lib/utils';

/**
 * Image slot used for every photo on the site.
 *
 * - With `src`: next/image, graded by the theme's --img-filter (`treat`), so
 *   renders and on-site photos from different years sit in one palette.
 * - Without `src`: a quiet placeholder in the theme's own colours, tagged
 *   DEMO so a missing asset is never mistaken for design.
 *
 * `zoom` adds the slow hover zoom (the link/card around it needs `group`).
 * `caption` prints a small label in the corner — used to mark renders as
 * "Визуализация" so a buyer never takes an unbuilt block for a photo.
 * `fill` drops the aspect box and fills the positioned parent instead.
 */
export function Media({
  src,
  alt,
  className,
  imgClassName,
  aspect = '4 / 3',
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  label,
  seed = 0,
  showTag = true,
  treat = true,
  zoom = false,
  position,
  caption,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspect?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  label?: string;
  seed?: number;
  showTag?: boolean;
  treat?: boolean;
  zoom?: boolean;
  /** CSS object-position, e.g. '50% 30%'. */
  position?: string;
  caption?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden bg-canvas-alt',
        fill ? 'absolute inset-0' : 'relative',
        zoom && 'zoom-media',
        className,
      )}
      style={fill ? undefined : { aspectRatio: aspect }}
    >
      {src ? (
        <Image
          // asset() adds the deployment basePath: next/image skips it under
          // images.unoptimized, which is the static-export config.
          src={asset(src)}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn('object-cover', treat && 'img-treat', imgClassName)}
          style={position ? { objectPosition: position } : undefined}
        />
      ) : (
        <Placeholder alt={alt} label={label} seed={seed} showTag={showTag} />
      )}
      {src && caption && (
        <>
          {/* Local scrim: the caption is the honesty label for renders and has
              to stay legible over pale pavement and sky. Only the bottom
              corner is shaded, so the photograph itself keeps its light. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 z-[1] h-24 w-full bg-gradient-to-t from-scrim/55 via-scrim/20 to-transparent md:h-28 md:w-2/3 md:bg-[radial-gradient(120%_100%_at_0%_100%,rgb(var(--scrim)/0.55),rgb(var(--scrim)/0.18)_45%,transparent_75%)]"
          />
          <span className="label pointer-events-none absolute bottom-4 left-4 z-[2] text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.5)]">
            {caption}
          </span>
        </>
      )}
    </div>
  );
}

function Placeholder({
  alt,
  label,
  seed,
  showTag,
}: {
  alt: string;
  label?: string;
  seed: number;
  showTag: boolean;
}) {
  const shift = (seed % 5) * 14;
  return (
    <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-canvas-alt">
      <svg
        viewBox="0 0 400 140"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-3/5 w-full text-ink opacity-[0.07]"
        aria-hidden="true"
      >
        <g fill="currentColor" transform={`translate(${shift} 0)`}>
          <rect x="8" y="70" width="34" height="70" />
          <rect x="50" y="42" width="40" height="98" />
          <rect x="98" y="86" width="30" height="54" />
          <rect x="136" y="30" width="44" height="110" />
          <rect x="188" y="60" width="36" height="80" />
          <rect x="232" y="20" width="30" height="120" />
          <rect x="270" y="72" width="40" height="68" />
          <rect x="318" y="48" width="38" height="92" />
          <rect x="364" y="80" width="30" height="60" />
        </g>
      </svg>
      {label && <span className="label relative z-10 max-w-[22ch] px-4 text-center text-muted">{label}</span>}
      {showTag && <span className="label absolute bottom-3 right-3 z-10 text-muted/70">demo</span>}
    </div>
  );
}
