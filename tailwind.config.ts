import type { Config } from 'tailwindcss';

/**
 * Every colour is a CSS variable set per theme in src/app/globals.css
 * (data-theme="warm" | "dark" | "stone"). Utilities stay semantic — `bg-canvas`,
 * `text-ink`, `text-muted`, `bg-band` — so switching the theme never needs a
 * component edit. Raw hex values do not belong in components.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  // `.container` is defined by hand in globals.css: a fluid measure with a
  // clamp() gutter reads calmer than Tailwind's stepped breakpoint widths.
  corePlugins: { container: false },
  theme: {
    // Architectural geometry: square corners everywhere. `full` stays for dots
    // and the odd round control.
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      '3xl': '0',
      full: '9999px',
    },
    extend: {
      colors: {
        canvas: { DEFAULT: rgb('--canvas'), alt: rgb('--canvas-alt') },
        surface: rgb('--surface'),
        ink: rgb('--ink'),
        muted: rgb('--muted'),
        accent: {
          DEFAULT: rgb('--accent'),
          soft: rgb('--accent-soft'),
          strong: rgb('--accent-strong'),
        },
        'on-accent': rgb('--on-accent'),
        band: { DEFAULT: rgb('--band'), fg: rgb('--band-fg'), muted: rgb('--band-muted') },
        // Field errors: `danger` on canvas / canvas-alt / surface, `danger-band`
        // on the contrast band. Both hold AA (≥4.5:1) in every theme.
        danger: { DEFAULT: rgb('--danger'), band: rgb('--danger-on-band') },
        line: rgb('--line'),
        scrim: rgb('--scrim'),

        // Legacy names from the first design, mapped onto the theme so older
        // screens (the /preview directions) keep rendering coherently.
        brand: { DEFAULT: rgb('--accent'), 600: rgb('--accent-strong'), 700: rgb('--accent-strong') },
        graphite: { DEFAULT: rgb('--band'), 900: rgb('--scrim') },
        sand: rgb('--canvas'),
        stone: rgb('--canvas-alt'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // One display ramp, five steps. Light weights at large sizes carry the
        // architectural tone; tracking tightens as size grows.
        hero: ['clamp(3rem, 8.6vw, 9.5rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
        'display-xl': ['clamp(2.5rem, 6vw, 6.25rem)', { lineHeight: '0.96', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2.125rem, 4.2vw, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.035em' }],
        'display-md': ['clamp(1.625rem, 2.6vw, 2.75rem)', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'display-sm': ['clamp(1.25rem, 1.7vw, 1.625rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        lead: ['clamp(1.0625rem, 1.3vw, 1.3125rem)', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
        label: ['0.72rem', { lineHeight: '1.2', letterSpacing: '0.16em' }],
        // Legacy alias.
        'display-2xl': ['clamp(3rem, 8.6vw, 9.5rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
      },
      spacing: {
        // Vertical rhythm between sections, and the grid gutter.
        section: 'clamp(5.5rem, 11vw, 11rem)',
        'section-sm': 'clamp(4rem, 7vw, 7rem)',
        gutter: 'clamp(1rem, 2.2vw, 2.25rem)',
        header: 'var(--header-h)',
      },
      letterSpacing: {
        label: '0.16em',
      },
      maxWidth: {
        prose: '64ch',
        measure: '1680px',
      },
      boxShadow: {
        card: 'none',
        float: '0 40px 80px -40px rgb(0 0 0 / 0.35)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
        arch: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        900: '900ms',
        1200: '1200ms',
        1600: '1600ms',
      },
      keyframes: {
        // Transform-only so content is NEVER gated on the animation completing.
        'fade-up': {
          from: { transform: 'translateY(24px)' },
          to: { transform: 'translateY(0)' },
        },
        'hero-in': {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'hero-zoom': {
          from: { transform: 'scale(1.08)' },
          to: { transform: 'scale(1)' },
        },
        'line-in': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'hero-in': 'hero-in 1s cubic-bezier(0.22,1,0.36,1) both',
        'hero-zoom': 'hero-zoom 2.4s cubic-bezier(0.22,1,0.36,1) both',
        'line-in': 'line-in 1.2s cubic-bezier(0.65,0,0.35,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
