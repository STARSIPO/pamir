'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { THEME_COLOR, type ThemeName } from '@/config/theme';

/**
 * Keeps two document-level details in step with the page after hydration and
 * on every client-side navigation, where the root layout — and the inline
 * themeBootScript (src/config/theme.ts) that set them before first paint —
 * do not run again:
 *
 *  - <html lang>: the root layout owns <html> but has no locale param, so it
 *    ships lang="ru" for /ro pages too;
 *  - meta theme-color: follows a ?theme= preview. Next may insert its own
 *    theme-color meta (the SITE_THEME value) while hydrating or navigating.
 */
export function DocumentSync({ lang }: { lang: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (root.lang !== lang) root.lang = lang;

    const color = THEME_COLOR[root.getAttribute('data-theme') as ThemeName];
    if (color) {
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        if (m.getAttribute('content') !== color) m.setAttribute('content', color);
      });
    }
  }, [lang, pathname]);

  return null;
}
