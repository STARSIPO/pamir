import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2.5rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1360px',
      },
    },
    extend: {
      colors: {
        // Brand palette extracted from the real Pamir Construct logo & site.
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
        },
        graphite: {
          DEFAULT: 'rgb(var(--graphite) / <alpha-value>)',
          900: 'rgb(var(--graphite-900) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        stone: 'rgb(var(--stone) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        // Fluid display scale
        'display-2xl': ['clamp(2.75rem, 6vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(2.4rem, 4.6vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(2rem, 3.4vw, 3.4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.6rem, 2.4vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      letterSpacing: {
        label: '0.18em',
      },
      maxWidth: {
        prose: '68ch',
      },
      borderRadius: {
        xl: '1.15rem',
        '2xl': '1.6rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,22,24,0.04), 0 18px 48px -24px rgba(20,22,24,0.22)',
        float: '0 30px 80px -32px rgba(20,22,24,0.45)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        // Transform-only so content is NEVER gated on the animation completing
        // (opacity stays 1 even if the animation clock is throttled/paused).
        'fade-up': {
          from: { transform: 'translateY(14px)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
