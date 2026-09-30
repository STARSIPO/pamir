'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { parsePathname, switchLocalePath } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * RU / RO — two tracked labels and a thin slash. No pills, no flags.
 *
 * The current language is full strength; the other recedes and comes forward
 * on hover. Each link is a 44×44 target so the switcher is usable beside
 * the menu button on a phone; callers pull it -12px (`-ml-3`) to align the
 * first label with their edge.
 *
 * tone
 *   auto  — follows currentColor (the header: white over the hero, ink when solid)
 *   light — on photographs
 *   dark  — on canvas
 *   band  — on the contrast band (footer)
 */
type Tone = 'auto' | 'light' | 'dark' | 'band';

const toneClass: Record<Tone, string> = {
  auto: '',
  light: 'text-white',
  dark: 'text-ink',
  band: 'text-band-fg',
};

export function LanguageSwitcher({
  current,
  tone = 'auto',
  label,
  className,
}: {
  current: Locale;
  tone?: Tone;
  /** Accessible name of the group, e.g. dict.footer.langLabel. */
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const parsed = parsePathname(pathname);

  return (
    <div role="group" aria-label={label} className={cn('label flex items-center', toneClass[tone], className)}>
      {locales.map((l, i) => {
        const active = l === current;
        return (
          <span key={l} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="opacity-30">
                /
              </span>
            )}
            <Link
              href={switchLocalePath(l, parsed)}
              hrefLang={l}
              lang={l}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'inline-flex h-11 min-w-11 items-center justify-center transition-opacity duration-500 ease-premium',
                // 80%, not less: over a hero photo the receded label is
                // white on sky, and anything fainter drops under 3:1.
                active ? 'opacity-100' : 'opacity-80 hover:opacity-100',
              )}
            >
              {localeNames[l]}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
