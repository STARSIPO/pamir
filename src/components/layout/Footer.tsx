import Link from 'next/link';
import { MapPin, Clock, Mail } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact, social, companyLegalName } from '@/content/site';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { telHref, currentYear } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const featured = projects.filter((p) => p.featured || p.status === 'completed').slice(0, 5);

  return (
    <footer className="bg-graphite-900 text-white">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo className="text-white" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/55">
              {dict.footer.tagline}
            </p>
            {social.length > 0 && (
              <div className="mt-6 flex gap-3">
                {social.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-brand hover:text-brand"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-label text-white/40">
              {dict.footer.nav}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {primaryNav.map((item) => (
                <li key={item.route}>
                  <Link
                    href={routes[item.route](locale)}
                    className="text-white/70 transition-colors hover:text-brand"
                  >
                    {item.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Projects */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-label text-white/40">
              {dict.footer.projects}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {featured.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={routes.project(locale, p.slug)}
                    className="text-white/70 transition-colors hover:text-brand"
                  >
                    {p.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-label text-white/40">
              {dict.footer.contacts}
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              {contact.phones.map((p) => (
                <li key={p.number} className="flex flex-col">
                  <span className="text-xs text-white/40">{p.label[locale]}</span>
                  <a href={telHref(p.number)} className="font-semibold text-white transition-colors hover:text-brand">
                    {p.number}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a href={`mailto:${contact.email}`} className="hover:text-brand">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {contact.address[locale]}
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {contact.hours[locale]}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear()} {companyLegalName}. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link href={routes.privacy(locale)} className="transition-colors hover:text-white">
              {dict.footer.privacy}
            </Link>
            <LanguageSwitcher current={locale} tone="light" />
          </div>
        </div>
      </div>
    </footer>
  );
}
