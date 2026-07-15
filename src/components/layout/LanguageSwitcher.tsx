'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { parsePathname, switchLocalePath } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  current,
  tone = 'auto',
  className,
}: {
  current: Locale;
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
}) {
  const pathname = usePathname();
  const parsed = parsePathname(pathname);

  const inactive =
    tone === 'light'
      ? 'text-white/55 hover:text-white'
      : tone === 'dark'
        ? 'text-muted hover:text-ink'
        : 'text-current/55 hover:text-current';

  return (
    <div className={cn('flex items-center gap-1 text-sm font-semibold', className)}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-current/25">/</span>}
          <Link
            href={switchLocalePath(l, parsed)}
            hrefLang={l}
            aria-current={l === current ? 'true' : undefined}
            className={cn(
              'transition-colors',
              l === current ? 'text-current' : inactive,
            )}
          >
            {localeNames[l]}
          </Link>
        </span>
      ))}
    </div>
  );
}
