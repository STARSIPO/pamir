/**
 * Site colour theme.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  To switch the whole site, change SITE_THEME below. Nothing else.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 *   'warm'  — Variant 1 · Warm Architectural (default)
 *   'dark'  — Variant 2 · Premium Dark
 *   'stone' — Variant 3 · Modern Stone
 *
 * The value lands on <html data-theme="…">; every colour on the site is a CSS
 * variable declared per theme in src/app/globals.css. Components never use raw
 * hex values, so the three variants are complete, not partial re-skins.
 *
 * For a side-by-side look without rebuilding, append `?theme=dark` (or
 * `warm` / `stone`) to any URL. The choice sticks for the browser session;
 * `?theme=reset` returns to SITE_THEME. See themeBootScript below.
 */
export const THEMES = ['warm', 'dark', 'stone'] as const;
export type ThemeName = (typeof THEMES)[number];

export const SITE_THEME: ThemeName = 'warm';

/** Browser-chrome colour per theme (matches --canvas in globals.css). */
export const THEME_COLOR: Record<ThemeName, string> = {
  warm: '#F2EFE9',
  dark: '#111210',
  stone: '#E9E9E5',
};

/**
 * Inline, render-blocking on purpose: it runs before first paint, so a preview
 * theme from `?theme=` never flashes the default palette first. Storage access
 * is wrapped because it throws in some private modes; failure just means the
 * default theme.
 */
export const themeBootScript = `(function(){try{var t=${JSON.stringify(THEMES)},d=document.documentElement,q=new URLSearchParams(location.search).get('theme'),k='pamir-theme';if(q==='reset'){sessionStorage.removeItem(k)}else if(q&&t.indexOf(q)>-1){sessionStorage.setItem(k,q)}var s=sessionStorage.getItem(k);if(s&&t.indexOf(s)>-1){d.setAttribute('data-theme',s)}}catch(e){}})();`;
