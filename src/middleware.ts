import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale } from '@/i18n/config';
import { canonicalizeRoSegment } from '@/i18n/routing';

export const config = {
  // Run on everything except API, Next internals, and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const segments = pathname.split('/').filter(Boolean); // e.g. ['ro','proiecte','botanic-star']
  const maybeLocale = segments[0];

  // 1) No locale prefix → redirect to the default locale, preserving the path.
  if (!maybeLocale || !isLocale(maybeLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // 2) RO localized slug → rewrite to the canonical internal folder segment.
  if (maybeLocale === 'ro' && segments[1]) {
    const canonical = canonicalizeRoSegment(segments[1]);
    if (canonical) {
      const url = req.nextUrl.clone();
      const rest = segments.slice(2);
      url.pathname = `/ro/${canonical}${rest.length ? '/' + rest.join('/') : ''}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
