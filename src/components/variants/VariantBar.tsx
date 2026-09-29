import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { variants, type VariantKey } from './registry';

/**
 * Switcher pinned above every preview. Also the honesty marker: it states in
 * the page itself that this is a design comparison, not the live site.
 */
export function VariantBar({ current, locale }: { current: VariantKey; locale: Locale }) {
  const active = variants.find((v) => v.key === current)!;

  return (
    <div className="border-b border-white/10 bg-graphite-900 text-white">
      <div className="container flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-label text-brand">
          {locale === 'ru' ? 'Превью дизайна' : 'Previzualizare design'}
        </span>

        <nav className="flex flex-wrap items-center gap-1">
          {variants.map((v) => (
            <Link
              key={v.key}
              href={`/${locale}/preview/${v.key}`}
              aria-current={v.key === current ? 'page' : undefined}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold transition-colors',
                v.key === current
                  ? 'bg-brand text-graphite-900'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="tabular mr-1.5 opacity-60">{v.no}</span>
              {v.name[locale]}
            </Link>
          ))}
        </nav>

        <p className="ml-auto max-w-lg text-[0.7rem] leading-snug text-white/45">
          {active.needs[locale]}
        </p>
      </div>
    </div>
  );
}
