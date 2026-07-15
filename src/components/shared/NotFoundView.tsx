'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';

export function NotFoundView() {
  const pathname = usePathname();
  const seg = pathname.split('/').filter(Boolean)[0];
  const locale: Locale = seg && isLocale(seg) ? seg : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="flex min-h-[70vh] items-center bg-sand">
      <div className="container py-24 text-center">
        <p className="font-display text-[7rem] font-extrabold leading-none text-brand">404</p>
        <h1 className="mt-4 font-display text-display-md font-semibold text-ink">{dict.notFound.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted">{dict.notFound.subtitle}</p>
        <Link
          href={routes.home(locale)}
          className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-brand px-7 font-semibold text-graphite-900 transition-colors hover:bg-brand-600"
        >
          {dict.notFound.backHome}
        </Link>
      </div>
    </section>
  );
}
