'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { Media } from '@/components/ui/Media';
import { cn } from '@/lib/utils';

interface Slide {
  src?: string;
  seed: number;
}

export function Gallery({
  images,
  name,
  locale,
  fallbackCount = 6,
}: {
  images: string[];
  name: string;
  locale: Locale;
  fallbackCount?: number;
}) {
  const slides: Slide[] =
    images.length > 0
      ? images.map((src, i) => ({ src, seed: i }))
      : Array.from({ length: fallbackCount }, (_, i) => ({ src: undefined, seed: i }));

  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + slides.length) % slides.length)),
    [slides.length],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % slides.length)),
    [slides.length],
  );

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, prev, next]);

  const label = locale === 'ru' ? 'Фото объекта' : 'Foto obiect';

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className={cn(
              'group relative overflow-hidden rounded-xl',
              i === 0 && 'col-span-2 row-span-2 md:col-span-2 md:row-span-2',
            )}
            aria-label={`${name} — ${i + 1}`}
          >
            <Media
              src={s.src}
              alt={`${name} — ${i + 1}`}
              aspect={i === 0 ? '4 / 3' : '4 / 3'}
              seed={s.seed}
              label={label}
              showTag={false}
              sizes="(max-width: 768px) 50vw, 33vw"
              imgClassName="transition-transform duration-700 ease-premium group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-graphite-900/0 transition-colors group-hover:bg-graphite-900/15" />
          </button>
        ))}
      </div>

      {open !== null && (
          <div
            className="fixed inset-0 z-[110] flex flex-col bg-graphite-900/95 backdrop-blur"
            onClick={close}
          >
            <div className="flex items-center justify-between px-5 py-4 text-white/70">
              <span className="text-sm tabular">
                {open + 1} / {slides.length}
              </span>
              <button onClick={close} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div
              className="relative flex flex-1 items-center justify-center px-4 pb-10"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (dx > 50) prev();
                else if (dx < -50) next();
                touchX.current = null;
              }}
            >
              <button
                onClick={prev}
                aria-label="Previous"
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div key={open} className="w-full max-w-5xl animate-fade-up">
                <Media
                  src={slides[open].src}
                  alt={`${name} — ${open + 1}`}
                  aspect="16 / 10"
                  seed={slides[open].seed}
                  label={label}
                  showTag={false}
                  className="rounded-xl"
                  sizes="100vw"
                />
              </div>

              <button
                onClick={next}
                aria-label="Next"
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
    </>
  );
}
