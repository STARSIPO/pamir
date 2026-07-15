'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Phone, X } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact, social } from '@/content/site';
import { routes } from '@/i18n/routing';
import { telHref } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/Button';

/**
 * Full-screen mobile menu. Rendered only when open and visible by default
 * (entrance is a CSS transform animation), so it never depends on a JS
 * animation frame to become visible.
 */
export function MobileMenu({
  open,
  onClose,
  locale,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: Dictionary;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-graphite-900 text-white lg:hidden">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href={routes.home(locale)} onClick={onClose} aria-label="Pamir Construct">
          <Logo />
        </Link>
        <button
          onClick={onClose}
          aria-label={dict.common.close}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
        {primaryNav.map((item, i) => (
          <Link
            key={item.route}
            href={routes[item.route](locale)}
            onClick={onClose}
            className="block animate-fade-up border-b border-white/10 py-4 font-display text-3xl font-semibold tracking-tight hover:text-brand"
            style={{ animationDelay: `${0.05 + i * 0.05}s` }}
          >
            {item.label[locale]}
          </Link>
        ))}
      </nav>

      <div className="space-y-4 px-6 pb-8 pt-4">
        <a href={telHref(contact.primaryPhone)} className="flex items-center gap-3 text-lg font-semibold">
          <Phone className="h-5 w-5 text-brand" />
          {contact.primaryPhone}
        </a>
        <div className="flex items-start gap-3 text-sm text-white/65">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          {contact.address[locale]}
        </div>
        <div className="flex items-start gap-3 text-sm text-white/65">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          {contact.hours[locale]}
        </div>

        <div className="flex items-center justify-between pt-2">
          <LanguageSwitcher current={locale} tone="light" />
          {social.length > 0 && (
            <div className="flex gap-4 text-sm text-white/65">
              {social.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <Button href={routes.contacts(locale)} variant="primary" size="lg" arrow className="mt-2 w-full" onClick={onClose}>
          {dict.common.contactUs}
        </Button>
      </div>
    </div>
  );
}
