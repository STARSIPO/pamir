import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { CatalogHome } from '@/components/variants/CatalogHome';
import { FacadeHome } from '@/components/variants/FacadeHome';
import { InventoryHome } from '@/components/variants/InventoryHome';
import { VariantBar } from '@/components/variants/VariantBar';
import { variants, isVariant, type VariantKey } from '@/components/variants/registry';

export function generateStaticParams() {
  return locales.flatMap((locale) => variants.map((v) => ({ locale, variant: v.key })));
}

/**
 * Design previews. Three competing directions for the homepage, each rendered
 * from the real dictionary content so the comparison is honest.
 *
 * Kept out of search: noindex here, Disallow in robots.ts, absent from the
 * sitemap. These are a decision aid for the client, not pages for buyers.
 */
export async function generateMetadata(props: {
  params: Promise<{ locale: string; variant: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const variant = variants.find((v) => v.key === params.variant);
  return {
    title: variant ? `Превью — ${variant.name.ru}` : 'Превью',
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage(props: {
  params: Promise<{ locale: string; variant: string }>;
}) {
  const params = await props.params;
  if (!isVariant(params.variant)) notFound();

  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const variant: VariantKey = params.variant;

  return (
    <>
      <VariantBar current={variant} locale={locale} />
      {variant === 'catalog' && <CatalogHome locale={locale} dict={dict} />}
      {variant === 'facade' && <FacadeHome locale={locale} dict={dict} />}
      {variant === 'inventory' && <InventoryHome locale={locale} dict={dict} />}
    </>
  );
}
