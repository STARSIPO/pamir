import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { primaryNav, contact, social, companyLegalName } from '@/content/site';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { telHref, currentYear, cn } from '@/lib/utils';
import { Arrow } from '@/components/ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BackToTop } from './Header';

/**
 * Footer on the contrast band. On most pages it follows a band section
 * (LeadSection / CtaBand), so it opens with an in-container hairline rather
 * than a new block: the two read as one dark plane.
 *
 *   ──────────────────────────────────────────────────────────────────────
 *   Строим современные жилые        НАВИГАЦИЯ     ПРОЕКТЫ        КОНТАКТЫ
 *   комплексы в Кишинёве…           О компании    Botanic Star   Отдел продаж
 *   FACEBOOK ↗                      …             …              +373 …
 *
 *   PAMIR CONSTRUCT  (fitted to the container width)
 *   ──────────────────────────────────────────────────────────────────────
 *   © 2026 Pamir Construct. Все права…      Политика   RU / RO   НАВЕРХ ↑
 */
export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="bg-band text-band-fg">
      <div className="container">
        <div className="border-t border-band-fg/15 pt-[clamp(3.5rem,7vw,6.5rem)]">
          <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-gutter">
            {/* Statement + social */}
            <div className="lg:col-span-4">
              <p className="max-w-[24ch] font-display text-display-sm font-light text-balance">
                {dict.footer.tagline}
              </p>
              {social.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-x-8 lg:mt-10">
                  {social.map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group label inline-flex h-11 items-center gap-2 text-band-muted transition-colors duration-500 hover:text-band-fg"
                      >
                        <span className="link-line pb-0.5">{s.name}</span>
                        <Arrow className="w-4 -rotate-45 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-gutter gap-y-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] lg:col-span-8 lg:col-start-5">
              <Column title={dict.footer.nav}>
                {primaryNav.map((item) => (
                  <li key={item.route}>
                    <FooterLink href={routes[item.route](locale)}>{item.label[locale]}</FooterLink>
                  </li>
                ))}
              </Column>

              <Column title={dict.footer.projects}>
                {projects.map((p) => (
                  <li key={p.slug}>
                    <FooterLink href={routes.project(locale, p.slug)}>{p.name[locale]}</FooterLink>
                  </li>
                ))}
              </Column>

              <Column title={dict.footer.contacts} className="col-span-2 md:col-span-1">
                {contact.phones.map((p) => (
                  <li key={p.number} className="mb-3">
                    <span className="block text-[0.8125rem] text-band-muted">{p.label[locale]}</span>
                    <FooterLink href={telHref(p.number)} className="tabular lg:min-h-8">
                      {p.number}
                    </FooterLink>
                  </li>
                ))}
                <li>
                  <FooterLink href={`mailto:${contact.email}`}>{contact.email}</FooterLink>
                </li>
                <li className="mt-3 text-pretty text-[0.9375rem] leading-relaxed text-band-muted">
                  <p>{contact.address[locale]}</p>
                  {/* "Пн–Сб: 9:00–18:00 · Вс: выходной" — one schedule per line. */}
                  <p className="mt-2">
                    {contact.hours[locale].split(' · ').map((part) => (
                      <span key={part} className="block">
                        {part}
                      </span>
                    ))}
                  </p>
                </li>
              </Column>
            </div>
          </div>

          {/* Wordmark, fitted to the container: the SVG scales with its
              viewBox, so it can never overflow a 375px screen. Measured in
              Inter Tight 300 at -0.04em: ink runs x 0→1000, cap height 116
              sits on the baseline; `x` cancels the P's side bearing so the
              stem aligns with the grid. textLength pins the advance, so a
              wider fallback font compresses instead of spilling out. */}
          <div aria-hidden="true" className="mt-[clamp(4.5rem,10vw,9rem)] select-none">
            <svg viewBox="0 0 1000 118" className="block h-auto w-full" focusable="false">
              <text
                x="-12.2"
                y="116"
                textLength="1008.9"
                lengthAdjust="spacing"
                className="fill-current font-display font-light"
                style={{ fontSize: 156.3, letterSpacing: '-0.04em' }}
              >
                {companyLegalName}
              </text>
            </svg>
          </div>

          {/* Legal row */}
          {/* Legal row. Phone/tablet: © / privacy / RU·RO ↔ back-to-top, in
              DOM order. From lg: one line, © left and the controls right. */}
          <div className="mt-[clamp(1.5rem,3vw,2.5rem)] grid grid-cols-[1fr_auto] items-center border-t border-band-fg/15 pb-5 pt-5 lg:flex lg:gap-8 lg:pb-7 lg:pt-4">
            <p className="col-span-2 text-[0.8125rem] leading-relaxed text-band-muted lg:mr-auto">
              © {currentYear()} {companyLegalName}. {dict.footer.rights}
            </p>
            <Link
              href={routes.privacy(locale)}
              className="group col-span-2 inline-flex h-11 items-center justify-self-start text-[0.8125rem] text-band-muted transition-colors duration-500 hover:text-band-fg"
            >
              <span className="link-line pb-0.5">{dict.footer.privacy}</span>
            </Link>
            <LanguageSwitcher current={locale} tone="band" label={dict.footer.langLabel} className="-ml-2.5 lg:-mx-2.5" />
            <BackToTop label={dict.design.backToTop} className="justify-self-end text-band-fg" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function Column({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="label text-band-muted">{title}</h2>
      <ul className="mt-5 lg:mt-7">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = /^(tel:|mailto:)/.test(href);
  const classes = cn(
    'group inline-flex min-h-11 items-center py-1.5 text-[0.9375rem] leading-snug text-band-fg lg:min-h-9',
    className,
  );
  // balance: "Botanic Star 2 — / блок 2", never an orphaned digit.
  const inner = <span className="link-line pb-0.5 text-balance">{children}</span>;
  return external ? (
    <a href={href} className={classes}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
