'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact } from '@/content/site';
import { routes, parsePathname } from '@/i18n/routing';
import { telHref, cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const parsed = parsePathname(pathname);
  const isHome = !parsed?.key && pathname.replace(/\/$/, '') === `/${locale}`;
  const isProjectDetail = parsed?.key === 'projects' && !!parsed.slug;
  const overHero = isHome || isProjectDetail;

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || !overHero;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-premium',
          solid
            ? 'border-b border-line/10 bg-white/85 text-ink backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent text-white',
        )}
      >
        <div
          className={cn(
            'container flex items-center justify-between transition-all duration-500 ease-premium',
            solid ? 'h-[72px]' : 'h-[88px]',
          )}
        >
          <Link href={routes.home(locale)} aria-label="Pamir Construct" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {primaryNav.map((item) => {
              const active = parsed?.key === item.route;
              return (
                <Link
                  key={item.route}
                  href={routes[item.route](locale)}
                  className={cn(
                    'link-underline text-sm font-medium transition-colors',
                    active ? 'text-brand' : 'hover:text-brand',
                  )}
                >
                  {item.label[locale]}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <LanguageSwitcher current={locale} tone="auto" />
            <span className="h-5 w-px bg-current/20" />
            <a
              href={telHref(contact.primaryPhone)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brand"
            >
              <Phone className="h-4 w-4" />
              {contact.primaryPhone}
            </a>
            <Button href={routes.contacts(locale)} size="md" arrow>
              {dict.common.contactUs}
            </Button>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher current={locale} tone="auto" />
            <button
              onClick={() => setOpen(true)}
              aria-label={dict.common.menu}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
                solid ? 'border-line/20 hover:bg-ink/5' : 'border-white/25 hover:bg-white/10',
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {!overHero && <div className="h-[72px]" aria-hidden="true" />}

      <MobileMenu open={open} onClose={() => setOpen(false)} locale={locale} dict={dict} />
    </>
  );
}
