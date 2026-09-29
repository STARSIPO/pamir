import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight } from 'next/font/google';
import { companyLegalName } from '@/content/site';
import { SITE_THEME, THEME_COLOR, themeBootScript } from '@/config/theme';

// Both faces are variable fonts: one file per subset covers every weight used
// (300–500), so no weight list is declared.
// Body: Inter — neutral, excellent Cyrillic and Romanian diacritics (ș ț ă î â).
const sans = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

// Display: Inter Tight in light weights — large, thin, tightly tracked
// headlines that read like lettering on an elevation drawing.
const display = Inter_Tight({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

export const viewport: Viewport = {
  themeColor: THEME_COLOR[SITE_THEME],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title (per-locale default + template) is owned by the [locale] layout.
  applicationName: companyLegalName,
  formatDetection: { telephone: true },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: 'any' }],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={SITE_THEME}
      className={`${sans.variable} ${display.variable}`}
      // The boot script may swap data-theme for a ?theme= preview before paint.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
