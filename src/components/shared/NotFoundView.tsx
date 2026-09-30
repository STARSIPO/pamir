'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { defaultLocale, isLocale, localeHtmlLang, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { contact, companyLegalName } from '@/content/site';
import { cn, currentYear, telHref } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

/**
 * 404 in the site's language: a "404" label on a hairline, a very large light
 * title, one line of explanation, two actions.
 *
 * `standalone` — for app/not-found.tsx, which renders in the root layout only
 * (no header, no footer): the view then brings its own logo bar, <main> and a
 * closing hairline row, so an unknown URL still lands on a finished page.
 * The locale comes from the first path segment; unknown → default locale.
 */
export function NotFoundView({ standalone = false }: { standalone?: boolean }) {
  const pathname = usePathname() ?? '';
  const seg = pathname.split('/').filter(Boolean)[0];
  const locale: Locale = seg && isLocale(seg) ? seg : defaultLocale;
  const dict = getDictionary(locale);

  const body = (
    <section className={cn('flex flex-col bg-canvas text-ink', standalone ? 'flex-1' : 'min-h-[78svh]')}>
      <div className="container flex flex-1 flex-col justify-center py-section-sm">
        <div className="flex items-center gap-4">
          <Reveal className="label shrink-0 tabular text-muted">404</Reveal>
          <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
        </div>

        {/* Title in 7 columns, lead from column 9: one empty column keeps the
            display line and the lead apart. */}
        <div className="mt-12 grid gap-y-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
          <Reveal stagger className="lg:col-span-7">
            <h1 className="font-display text-display-xl font-light text-balance">{splitWords(dict.notFound.title)}</h1>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="max-w-md text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
              {dict.notFound.subtitle}
            </p>
          </Reveal>
        </div>

        <Reveal
          delay={0.2}
          className="mt-14 flex flex-col items-start gap-6 border-t border-line/15 pt-10 sm:flex-row sm:items-center sm:gap-10 md:mt-20"
        >
          <Button href={routes.home(locale)} variant="primary" size="lg" arrow>
            {dict.notFound.backHome}
          </Button>
          <Button href={routes.projects(locale)} variant="ghost" arrow>
            {dict.common.viewProjects}
          </Button>
        </Reveal>
      </div>
    </section>
  );

  // Inside the locale layout the page title comes from its metadata.
  if (!standalone) return body;

  return (
    <div lang={localeHtmlLang[locale]} className="flex min-h-svh flex-col bg-canvas text-ink">
      {/* The root layout sets no title and not-found files take no metadata
          export, so the global 404 names itself. React 19 hoists this into
          <head>. */}
      <title>{`${dict.notFound.title} — ${dict.meta.titleSuffix}`}</title>
      <header className="container flex h-[88px] shrink-0 items-center justify-between">
        <Link href={routes.home(locale)} aria-label={companyLegalName} className="-m-2 p-2">
          <Logo />
        </Link>
        <a href={telHref(contact.primaryPhone)} className="link-line hidden text-sm tabular sm:inline-block">
          {contact.primaryPhone}
        </a>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {body}
      </main>
      <footer className="container shrink-0">
        <div className="flex flex-col gap-2 border-t border-line/15 py-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="label">
            © {currentYear()} {companyLegalName}
          </p>
          <p className="label">{dict.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
