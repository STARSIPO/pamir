export const locales = ['ru', 'ro'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const localeNames: Record<Locale, string> = {
  ru: 'RU',
  ro: 'RO',
};

/** BCP-47 codes for <html lang> and hreflang. */
export const localeHtmlLang: Record<Locale, string> = {
  ru: 'ru-MD',
  ro: 'ro-MD',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
