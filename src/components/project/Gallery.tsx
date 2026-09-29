'use client';

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Media } from '@/components/ui/Media';
import { Arrow } from '@/components/ui/Button';
import { lockScroll } from '@/lib/smooth-scroll';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { asset, cn } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');

interface Tile {
  /** Placement on the 4-col (phone) / 12-col (md+) grid. */
  place: string;
  aspect: string;
  sizes: string;
}

const STAGGER = 'md:mt-[clamp(4rem,9vw,9rem)]';

/**
 * Editorial rhythm instead of a uniform grid:
 *
 *   ┌──────────────────────────────────────────┐   01 — wide, full measure
 *   └──────────────────────────────────────────┘
 *   ┌────────────────────────┐   ┌──────────┐      02 + 03 — landscape / portrait,
 *   └────────────────────────┘   │          │      the second one dropped lower
 *                                └──────────┘
 *   ┌──────────┐   ┌────────────────────────┐      04 + 05 — mirrored
 *   │          │   └────────────────────────┘
 *   └──────────┘
 *
 * A trailing single image takes eight columns, pushed to the opposite side.
 */
function tileFor(i: number, count: number): Tile {
  if (i === 0) {
    return { place: 'col-span-4 md:col-span-12', aspect: 'aspect-[4/3] md:aspect-[16/9]', sizes: '100vw' };
  }
  const k = i - 1;
  const pair = Math.floor(k / 2);
  const second = k % 2 === 1;
  const mirrored = pair % 2 === 1;
  const alone = !second && i === count - 1;

  if (alone) {
    return {
      place: mirrored ? 'col-span-4 md:col-span-8' : 'col-span-4 md:col-span-8 md:col-start-5',
      aspect: 'aspect-[4/3] md:aspect-[3/2]',
      sizes: '(max-width: 768px) 100vw, 66vw',
    };
  }

  const wide = { aspect: 'aspect-[4/3]', sizes: '(max-width: 768px) 100vw, 58vw' };
  const narrow = { aspect: 'aspect-[4/5]', sizes: '(max-width: 768px) 75vw, 33vw' };

  if (!mirrored) {
    return second
      ? { ...narrow, place: cn('col-span-3 col-start-2 md:col-span-4 md:col-start-9', STAGGER) }
      : { ...wide, place: 'col-span-4 md:col-span-7' };
  }
  return second
    ? { ...wide, place: cn('col-span-4 md:col-span-7 md:col-start-6', STAGGER) }
    : { ...narrow, place: 'col-span-3 md:col-span-4' };
}

export function Gallery({
  images,
  name,
  caption,
  labels,
}: {
  images: string[];
  name: string;
  /** "Визуализация" when the pictures are renders. */
  caption?: string;
  labels: { close: string; title: string };
}) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const count = images.length;

  if (count === 0) return null;

  return (
    <>
      <div className="grid-12 gap-y-[clamp(2.5rem,6vw,6rem)]">
        {images.map((src, i) => {
          const t = tileFor(i, count);
          const alt = `${name} — ${pad(i + 1)} / ${pad(count)}`;
          return (
            <figure key={src + i} className={t.place}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-haspopup="dialog"
                aria-label={alt}
                className="group block w-full cursor-zoom-in text-left"
              >
                <MaskFrame className={t.aspect}>
                  <Media src={src} alt={alt} fill zoom sizes={t.sizes} caption={caption} />
                </MaskFrame>
              </button>
              <figcaption className="label mt-4 flex items-center justify-between gap-4 text-muted">
                <span className="tabular">
                  {pad(i + 1)} <span className="text-muted/60">/ {pad(count)}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {open !== null && (
        <Lightbox
          images={images}
          index={open}
          name={name}
          caption={caption}
          labels={labels}
          onIndex={setOpen}
          onClose={close}
        />
      )}
    </>
  );
}

/**
 * Full-screen viewer. A real dialog: focus moves to Close on open and returns
 * to the tile on close, Tab stays inside, Escape closes, arrow keys and
 * horizontal swipes step through the set. Page scroll (and Lenis) is paused.
 */
function Lightbox({
  images,
  index,
  name,
  caption,
  labels,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  name: string;
  caption?: string;
  labels: { close: string; title: string };
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  // Opacity-only entrance: the overlay must not slide.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const prevIndex = (index - 1 + count) % count;
  const nextIndex = (index + 1) % count;
  const prev = useCallback(() => onIndex(prevIndex), [onIndex, prevIndex]);
  const next = useCallback(() => onIndex(nextIndex), [onIndex, nextIndex]);

  // Mount / unmount: focus, scroll lock (compensating for the scrollbar so the
  // page behind does not shift), and focus restore.
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const { paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    lockScroll(true);
    closeRef.current?.focus();
    return () => {
      lockScroll(false);
      document.body.style.paddingRight = paddingRight;
      restoreTo?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (count > 1 && e.key === 'ArrowLeft') return prev();
      if (count > 1 && e.key === 'ArrowRight') return next();
      if (e.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [count, onClose, prev, next]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — ${labels.title}`}
      data-lenis-prevent
      className={cn(
        'fixed inset-0 z-[110] flex flex-col bg-scrim/95 text-white transition-opacity duration-500 ease-premium',
        shown ? 'opacity-100' : 'opacity-0',
      )}
      onClick={onClose}
    >
      <div className="container flex h-20 shrink-0 items-center justify-between gap-6 md:h-24">
        <p className="label flex min-w-0 items-center gap-4 text-white/60">
          <span className="shrink-0 whitespace-nowrap tabular text-white" aria-live="polite">
            {pad(index + 1)} <span className="text-white/50">/ {pad(count)}</span>
          </span>
          <span className="hidden truncate md:inline">{name}</span>
        </p>
        <CtrlButton
          ref={closeRef}
          label={labels.close}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <CloseGlyph />
        </CtrlButton>
      </div>

      <div
        className="relative mx-[var(--gutter)] min-h-0 flex-1"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 50) prev();
          else if (dx < -50) next();
          touchX.current = null;
        }}
      >
        <Slide key={index} src={images[index]} alt={`${name} — ${pad(index + 1)} / ${pad(count)}`} />
      </div>

      <div className="container flex h-20 shrink-0 items-center justify-between gap-6 md:h-24">
        {count > 1 ? (
          <CtrlButton
            label={`${name} — ${pad(prevIndex + 1)}`}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            <Arrow className="rotate-180 group-hover:-translate-x-1" />
          </CtrlButton>
        ) : (
          <span />
        )}
        {caption && <span className="label text-white/60">{caption}</span>}
        {count > 1 ? (
          <CtrlButton
            label={`${name} — ${pad(nextIndex + 1)}`}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <Arrow />
          </CtrlButton>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

/**
 * Mask reveal that cannot get stuck. Same look as <Reveal variant="mask">
 * (it reuses the global [data-mask] styles), but the element being observed
 * is an unclipped outer frame and the clip sits on the inner one: Chromium's
 * IntersectionObserver honours the target's own clip-path, so a target clipped
 * to nothing never reports an intersection and never opens.
 */
function MaskFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = usePrefersReducedMotion();
  const [state, setState] = useState<'init' | 'hidden' | 'shown'>('init');

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          io.disconnect();
        } else if (first) {
          setState('hidden');
        }
        first = false;
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <span ref={ref} className={cn('relative block', className)}>
      <span data-mask={state === 'init' ? undefined : state} className="absolute inset-0 block">
        {children}
      </span>
    </span>
  );
}

/** One photograph, faded in once decoded so a slow image never pops. */
function Slide({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);
  return (
    <Image
      src={asset(src)}
      alt={alt}
      fill
      sizes="100vw"
      onLoad={() => setReady(true)}
      className={cn(
        'img-treat object-contain transition-opacity duration-700 ease-premium',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}

/** Square hairline control, 48px — thin glyphs, no fills. */
const CtrlButton = forwardRef<
  HTMLButtonElement,
  { label: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode }
>(function CtrlButton({ label, onClick, children }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group flex h-12 w-12 shrink-0 items-center justify-center border border-white/20 text-white transition-colors duration-500 ease-premium hover:border-white/70 focus-visible:border-white"
    >
      {children}
    </button>
  );
});

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
