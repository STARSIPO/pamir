import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, localeHtmlLang, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { alternates } from '@/i18n/routing';
import { contact, companyLegalName } from '@/content/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pamirconstruct.md';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const alt = alternates();

  return {
    title: { default: dict.meta.defaultTitle, template: `%s — ${dict.meta.titleSuffix}` },
    description: dict.meta.defaultDescription,
    alternates: {
      canonical: `/${locale}`,
      languages: { 'ru-MD': alt.ru, 'ro-MD': alt.ro, 'x-default': alt.ru },
    },
    openGraph: {
      type: 'website',
      siteName: companyLegalName,
      locale: localeHtmlLang[locale].replace('-', '_'),
      title: dict.meta.defaultTitle,
      description: dict.meta.defaultDescription,
      url: `/${locale}`,
    },
    robots: { index: true, follow: true },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    name: companyLegalName,
    url: `${SITE_URL}/${locale}`,
    telephone: contact.primaryPhone,
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'str. Decebal 139/5, of. 1',
      addressLocality: 'Chișinău',
      addressCountry: 'MD',
    },
    areaServed: 'Chișinău',
    sameAs: ['https://www.facebook.com/PamirConstructMD'],
  };

  return (
    <div lang={localeHtmlLang[locale]}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {dict.common.learnMore}
      </a>
      <Header locale={locale} dict={dict} />
      <main id="main">{children}</main>
      <Footer locale={locale} dict={dict} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    </div>
  );
}
