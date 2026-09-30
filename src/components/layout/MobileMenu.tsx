'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact, social, companyLegalName } from '@/content/site';
import { routes, parsePathname } from '@/i18n/routing';
import { telHref, cn } from '@/lib/utils';
import { lockScroll } from '@/lib/smooth-scroll';
import { Logo } from '@/components/brand/Logo';
import { Button, Arrow } from '@/components/ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen menu below `lg`.
 *
 *   ▲ PAMIR                                        ╳
 *   НАВИГАЦИЯ ─────────────────────────────────────
 *   01   О компании                               →
 *   02   Проекты                                  →
 *   …
 *   ОТДЕЛ ПРОДАЖ
 *   +373 76 007 007
 *   office@… · Кишинёв, ул. Дечебал 139/5
 *   RU / RO                                 Facebook
 *   [ СВЯЗАТЬСЯ С НАМИ → ]
 *
 * Always mounted so it can fade both ways; `inert` + visibility keep it out of
 * the tab order and the accessibility tree while closed. Links arrive one by
 * one (CSS transitions, 60ms ladder); reduced motion collapses the ladder.
 */
export function MobileMenu({
  open,
  onClose,
  locale,
  dict,
  id = 'site-menu',
  compact = false,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: Dictionary;
  /** DOM id, referenced by the menu button's aria-controls. */
  id?: string;
  /** Match the header's compact height so the top bar does not jump. */
  compact?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const parsed = parsePathname(pathname);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;

    lockScroll(true);
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Rotating a tablet into the desktop layout hides the menu; release the
    // scroll lock with it.
    const wide = window.matchMedia('(min-width: 1024px)');
    const onWide = () => wide.matches && onClose();

    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
      lockScroll(false);
      // Back to the button that opened the menu (Safari never focuses it on click).
      document.querySelector<HTMLElement>(`[aria-controls="${id}"]`)?.focus({ preventScroll: true });
    };
  }, [open, onClose, id]);

  const salesPhone = contact.phones.find((p) => p.number === contact.primaryPhone) ?? contact.phones[0];

  // Entrance ladder: each step fades up once the panel is open.
  const step = (i: number) => ({
    className: cn(
      'transition-[opacity,transform] duration-700 ease-premium motion-reduce:![transition-delay:0ms]',
      open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
    ),
    style: { transitionDelay: open ? `${120 + i * 60}ms` : '0ms' },
  });

  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={dict.design.menuTitle}
      inert={!open}
      data-lenis-prevent
      className={cn(
        'fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-canvas text-ink lg:hidden',
        open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0',
      )}
      // Visibility flips at once on open (so focus can move in on the same
      // frame) and only after the fade on close.
      style={{
        transition: open
          ? 'opacity 500ms var(--ease-premium), visibility 0s'
          : 'opacity 500ms var(--ease-premium), visibility 0s linear 500ms',
      }}
    >
      {/* Top bar mirrors the header, so opening the menu reads as one surface. */}
      <div
        className={cn(
          'container flex shrink-0 items-center justify-between',
          'h-[var(--header-h-compact)]',
          !compact && 'md:h-[var(--header-h)]',
        )}
      >
        <Link href={routes.home(locale)} onClick={onClose} aria-label={companyLegalName} className="-my-2 py-2">
          <Logo />
        </Link>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="group relative -mr-2.5 flex h-11 w-11 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="absolute h-px w-6 rotate-45 bg-current transition-transform duration-500 ease-premium group-hover:rotate-[135deg]"
          />
          <span
            aria-hidden="true"
            className="absolute h-px w-6 -rotate-45 bg-current transition-transform duration-500 ease-premium group-hover:rotate-45"
          />
        </button>
      </div>

      <div className="container flex flex-1 flex-col pb-8 pt-6 md:pb-12 md:pt-10">
        <div {...step(0)}>
          <div className="flex items-center gap-4">
            <span className="label shrink-0 text-muted">{dict.design.menuTitle}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line/15" />
          </div>
        </div>

        <nav aria-label={dict.design.menuTitle} className="mt-3 md:mt-6">
          <ol>
            {primaryNav.map((item, i) => {
              const active = parsed?.key === item.route;
              const s = step(i + 1);
              return (
                <li key={item.route} className={cn('border-b border-line/15', s.className)} style={s.style}>
                  <Link
                    href={routes[item.route](locale)}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className="group flex items-center gap-5 py-4 md:gap-8 md:py-5"
                  >
                    <span className="label w-6 shrink-0 tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1 font-display text-display-lg font-light md:text-display-xl">
                      {item.label[locale]}
                    </span>
                    {active ? (
                      <span aria-hidden="true" className="mr-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    ) : (
                      <Arrow className="text-muted transition-[transform,color] group-hover:text-ink" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

        <div
          className={cn('mt-auto pt-12 md:pt-16', step(primaryNav.length + 1).className)}
          style={step(primaryNav.length + 1).style}
        >
          <div className="grid gap-6 sm:grid-cols-2 sm:items-end sm:gap-gutter">
            <div>
              <p className="label text-muted">{salesPhone.label[locale]}</p>
              <a
                href={telHref(salesPhone.number)}
                className="group mt-2 inline-flex min-h-11 items-center font-display text-display-md font-light tabular"
              >
                <span className="link-line">{salesPhone.number}</span>
              </a>
            </div>
            <div className="flex flex-col items-start text-[0.9375rem] leading-relaxed text-muted sm:pb-1">
              <a href={`mailto:${contact.email}`} className="group inline-flex min-h-11 items-center text-ink">
                <span className="link-line">{contact.email}</span>
              </a>
              <p>{contact.address[locale]}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-line/15 pt-2">
            <LanguageSwitcher current={locale} tone="dark" label={dict.footer.langLabel} className="-ml-3" />
            {social.length > 0 && (
              <ul className="flex items-center gap-6">
                {social.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group label inline-flex h-11 items-center gap-2 text-muted transition-colors duration-500 hover:text-ink"
                    >
                      <span className="link-line pb-0.5">{s.name}</span>
                      <Arrow className="w-4 -rotate-45 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            href={routes.contacts(locale)}
            variant="primary"
            size="lg"
            arrow
            className="mt-4 w-full"
            onClick={onClose}
          >
            {dict.common.contactUs}
          </Button>
        </div>
      </div>
    </div>
  );
}
