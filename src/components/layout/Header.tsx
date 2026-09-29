'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact, companyLegalName } from '@/content/site';
import { routes, parsePathname } from '@/i18n/routing';
import { telHref, cn } from '@/lib/utils';
import { getLenis } from '@/lib/smooth-scroll';
import { Logo } from '@/components/brand/Logo';
import { Button, Arrow } from '@/components/ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';

const MENU_ID = 'site-menu';

/**
 * Site header.
 *
 *   ▲ PAMIR          О компании  Проекты  Услуги  FAQ  Контакты  │  RU / RO   [ СВЯЗАТЬСЯ С НАМИ ]
 *
 * Over a hero photograph (home, project pages) it starts transparent with
 * white type; after a few pixels of scroll it settles into a compact bar on
 * the canvas colour with a hairline. Everywhere else it is solid from the
 * start and a spacer keeps the page below it. Below `lg` the nav collapses
 * into a two-line menu button that opens the full-screen <MobileMenu>.
 */
export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const parsed = parsePathname(pathname);
  const isHome = !parsed?.key && pathname.replace(/\/$/, '') === `/${locale}`;
  const isProjectDetail = parsed?.key === 'projects' && !!parsed.slug;
  const overHero = isHome || isProjectDetail;

  const [scrolled, setScrolled] = useState(false);
  // The menu remembers the path it was opened on, so any navigation closes it
  // by derivation — no effect, no extra render.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const closeMenu = useCallback(() => setMenuPath(null), []);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A sentinel pinned 20px down the document replaces a scroll listener: the
  // header state is a boolean, so it needs a threshold crossing, not a
  // position stream. Keeps the main thread free of per-frame scroll work.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const transparent = overHero && !scrolled;

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-5 h-px" />

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b',
          'transition-[background-color,color,border-color,backdrop-filter] duration-500 ease-premium',
          transparent
            ? 'border-transparent bg-transparent text-white'
            : cn('bg-canvas/85 text-ink backdrop-blur-md', scrolled ? 'border-line/10' : 'border-transparent'),
        )}
      >
        <div
          className={cn(
            'container flex items-center justify-between transition-[height] duration-500 ease-premium',
            'h-[var(--header-h-compact)]',
            !scrolled && 'md:h-[var(--header-h)]',
          )}
        >
          <Link href={routes.home(locale)} aria-label={companyLegalName} className="-my-2 shrink-0 py-2">
            <Logo />
          </Link>

          {/* Desktop */}
          <div className="hidden items-center lg:flex">
            <nav aria-label={dict.design.menuTitle}>
              <ul className="flex items-center gap-6 xl:gap-9">
                {primaryNav.map((item) => {
                  const active = parsed?.key === item.route;
                  return (
                    <li key={item.route}>
                      <Link
                        href={routes[item.route](locale)}
                        aria-current={active ? 'page' : undefined}
                        className="group relative inline-flex h-11 items-center text-[0.8125rem] font-medium"
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute -left-3 top-1/2 h-1 w-1 -translate-y-1/2 bg-accent"
                          />
                        )}
                        <span className="link-line pb-0.5">{item.label[locale]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <span aria-hidden="true" className="mx-5 h-4 w-px bg-current opacity-20 xl:mx-8" />

            <LanguageSwitcher current={locale} tone="auto" label={dict.footer.langLabel} className="-mx-1.5" />

            <a
              href={telHref(contact.primaryPhone)}
              className="group ml-8 hidden h-11 items-center text-[0.8125rem] font-medium tabular 2xl:inline-flex"
            >
              <span className="link-line pb-0.5">{contact.primaryPhone}</span>
            </a>

            <Button
              href={routes.contacts(locale)}
              variant={transparent ? 'outlineLight' : 'outline'}
              size="md"
              className="ml-5 h-11 px-5 xl:ml-8"
            >
              {dict.common.contactUs}
            </Button>
          </div>

          {/* Below lg: language + menu button */}
          <div className="flex items-center gap-1 lg:hidden">
            <LanguageSwitcher current={locale} tone="auto" label={dict.footer.langLabel} />
            <button
              type="button"
              onClick={() => setMenuPath(pathname)}
              aria-label={dict.common.menu}
              aria-expanded={open}
              aria-controls={MENU_ID}
              aria-haspopup="dialog"
              className="group -mr-2.5 flex h-11 w-11 flex-col items-end justify-center gap-[7px] px-2.5"
            >
              <span aria-hidden="true" className="block h-px w-6 bg-current" />
              <span
                aria-hidden="true"
                className="block h-px w-4 bg-current transition-[width] duration-500 ease-premium group-hover:w-6"
              />
            </button>
          </div>
        </div>
      </header>

      {!overHero && <div aria-hidden="true" className="h-[var(--header-h-compact)] md:h-[var(--header-h)]" />}

      <MobileMenu
        id={MENU_ID}
        open={open}
        onClose={closeMenu}
        locale={locale}
        dict={dict}
        compact={scrolled}
      />
    </>
  );
}

/**
 * "Наверх ↑" — used in the footer. Lives here, in the chrome's client module,
 * so the footer itself stays a Server Component. Scrolls through Lenis when it
 * drives the page, natively otherwise, and hands keyboard focus back to the
 * top of the document.
 */
export function BackToTop({ label, className }: { label: string; className?: string }) {
  const toTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.4 });
    } else {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
    document.querySelector<HTMLElement>('header a[href]')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      className={cn('group label inline-flex h-11 items-center gap-3', className)}
    >
      <span className="link-line pb-0.5">{label}</span>
      <Arrow className="w-5 -rotate-90 group-hover:-translate-y-1 group-hover:translate-x-0" />
    </button>
  );
}
