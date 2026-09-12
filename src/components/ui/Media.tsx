import Image from 'next/image';
import { asset, cn } from '@/lib/utils';

/**
 * Smart media slot.
 * - With `src`: optimized next/image (AVIF/WebP, lazy by default).
 * - Without `src`: a BRANDED PLACEHOLDER — clearly marked "DEMO", so the site
 *   never ships with silent gaps. Drop a real file in /public and set the
 *   content `src` to replace it; nothing else changes.
 *
 * See PLACEHOLDERS.md for the list of assets awaiting the client archive.
 */
export function Media({
  src,
  alt,
  className,
  imgClassName,
  aspect = '4 / 3',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  label,
  seed = 0,
  showTag = true,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspect?: string;
  priority?: boolean;
  sizes?: string;
  label?: string;
  seed?: number;
  showTag?: boolean;
}) {
  return (
    <div
      className={cn('relative overflow-hidden bg-graphite-900', className)}
      style={{ aspectRatio: aspect }}
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
          className={cn('object-cover', imgClassName)}
        />
      ) : (
        <Placeholder alt={alt} label={label} seed={seed} showTag={showTag} />
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
  // Deterministic skyline variation from the seed.
  const shift = (seed % 5) * 14;
  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          'linear-gradient(160deg, #1a1c1e 0%, #26282b 55%, #2f3134 100%)',
      }}
    >
      {/* skyline */}
      <svg
        viewBox="0 0 400 140"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-3/5 w-full opacity-[0.16]"
        aria-hidden="true"
      >
        <g fill="#ffffff" transform={`translate(${shift} 0)`}>
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

      {/* subtle brand accent line */}
      <span className="absolute left-0 top-0 h-1 w-16 bg-brand" />

      <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
        <svg viewBox="0 0 48 44" className="h-10 w-auto opacity-90" aria-hidden="true">
          <path
            d="M21.9 5.6a2.4 2.4 0 0 1 4.2 0l16.5 28.9a2.4 2.4 0 0 1-2.1 3.6H7.5a2.4 2.4 0 0 1-2.1-3.6L21.9 5.6Z"
            fill="rgb(124 193 43)"
          />
        </svg>
        {label && (
          <span className="max-w-[18ch] text-xs font-medium uppercase tracking-widest text-white/45">
            {label}
          </span>
        )}
      </div>

      {showTag && (
        <span className="absolute bottom-3 right-3 z-10 rounded bg-black/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-white/60">
          demo
        </span>
      )}
    </div>
  );
}
