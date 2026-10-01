import type { Localized } from './types';
import type { RouteKey } from '@/i18n/routing';

/**
 * Global site data — contacts, navigation, social.
 * Values marked `// CONFIRMED` come from the client's brief / live site.
 * Values marked `// TODO:CONFIRM` need the owner's sign-off before launch.
 */

export interface PhoneEntry {
  label: Localized;
  number: string;
}

export const contact = {
  phones: [
    {
      label: { ru: 'Отдел продаж', ro: 'Departament vânzări' },
      number: '+373 76 007 007', // CONFIRMED
    },
    {
      label: { ru: 'Администрация', ro: 'Administrație' },
      number: '+373 22 54 05 05', // CONFIRMED
    },
    {
      label: { ru: 'Бухгалтерия', ro: 'Contabilitate' },
      number: '+373 22 80 28 03', // CONFIRMED
    },
  ] satisfies PhoneEntry[],

  /** Primary CTA number (sales). */
  primaryPhone: '+373 76 007 007',

  email: 'office@pamirconstruct.md', // TODO:CONFIRM — placeholder address

  /**
   * The street part is tied with no-break spaces ( ), so a narrow
   * column (footer, contacts list) breaks only after the city —
   * "Кишинёв, / ул. Дечебал 139/5, офис 1" — never strands "офис 1".
   */
  address: {
    ru: 'Кишинёв, ул. Дечебал 139/5, офис 1',
    ro: 'Chișinău, str. Decebal 139/5, oficiul 1',
  } satisfies Localized, // CONFIRMED

  mapQuery: 'str. Decebal 139/5, Chișinău, Moldova',

  /**
   * Working hours — the old site showed conflicting variants.
   * TODO:CONFIRM the exact schedule with the owner before launch.
   */
  hours: {
    ru: 'Пн–Сб: 9:00–18:00 · Вс: выходной',
    ro: 'Lun–Sâm: 9:00–18:00 · Dum: închis',
  } satisfies Localized, // TODO:CONFIRM
};

export interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

/**
 * Social links. Facebook is confirmed. The old site's Instagram pointed to a
 * DIFFERENT company ("constructinvestgarantgrup") — intentionally omitted until
 * the correct Pamir Construct handle is provided.
 */
export const social: SocialLink[] = [
  { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/PamirConstructMD' }, // CONFIRMED
  // { name: 'Instagram', icon: 'instagram', url: '' }, // TODO:CONFIRM correct handle
];

export interface NavItem {
  route: RouteKey;
  label: Localized;
}

export const primaryNav: NavItem[] = [
  { route: 'company', label: { ru: 'О компании', ro: 'Despre companie' } },
  { route: 'projects', label: { ru: 'Проекты', ro: 'Proiecte' } },
  { route: 'news', label: { ru: 'Новости', ro: 'Noutăți' } },
  { route: 'services', label: { ru: 'Услуги', ro: 'Servicii' } },
  { route: 'faq', label: { ru: 'FAQ', ro: 'Întrebări' } },
  { route: 'contacts', label: { ru: 'Контакты', ro: 'Contacte' } },
];

export const companyLegalName = 'Pamir Construct';
export const foundedCity = { ru: 'Кишинёв', ro: 'Chișinău' } satisfies Localized;
