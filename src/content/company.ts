import type { Localized } from './types';

/** "About company" content — rewritten from the old site, not copied verbatim. */

export const companyIntro: Localized[] = [
  {
    ru: 'Pamir Construct — строительная компания из Кишинёва, которая создаёт жилые комплексы полного цикла: от проектирования до сдачи дома в эксплуатацию. Мы отвечаем за качество, надёжность и сроки на каждом этапе.',
    ro: 'Pamir Construct este o companie de construcții din Chișinău care creează complexe rezidențiale la cheie: de la proiectare până la darea în exploatare. Răspundem pentru calitate, fiabilitate și termene la fiecare etapă.',
  },
  {
    ru: 'Наши проекты — это не только стены, но и продуманная среда для жизни: закрытые дворы, инженерные системы, парковки и инфраструктура рядом с домом. Мы строим так, чтобы жильё оставалось комфортным и через годы.',
    ro: 'Proiectele noastre înseamnă nu doar pereți, ci un mediu de viață bine gândit: curți închise, sisteme inginerești, parcări și infrastructură lângă casă. Construim astfel încât locuința să rămână confortabilă și peste ani.',
  },
];

export const companyQuote: Localized = {
  ru: 'Дом — это крепость.',
  ro: 'Casa este o cetate.',
};

export interface Principle {
  icon: string;
  title: Localized;
  text: Localized;
}

export const principles: Principle[] = [
  {
    icon: 'shield-check',
    title: { ru: 'Качество и надёжность', ro: 'Calitate și fiabilitate' },
    text: {
      ru: 'Контроль на каждом этапе строительства и внимание к деталям — от фундамента до отделки.',
      ro: 'Control la fiecare etapă a construcției și atenție la detalii — de la fundație până la finisaj.',
    },
  },
  {
    icon: 'layers',
    title: { ru: 'Полный цикл', ro: 'Ciclu complet' },
    text: {
      ru: 'Проектирование, строительство и благоустройство — в рамках единой ответственности компании.',
      ro: 'Proiectare, construcție și amenajare — sub responsabilitatea unică a companiei.',
    },
  },
  {
    icon: 'ruler',
    title: { ru: 'Продуманная архитектура', ro: 'Arhitectură bine gândită' },
    text: {
      ru: 'Функциональные планировки, эстетичные фасады и удобная среда для повседневной жизни.',
      ro: 'Planuri funcționale, fațade estetice și un mediu comod pentru viața de zi cu zi.',
    },
  },
  {
    icon: 'clock',
    title: { ru: 'Соблюдение сроков', ro: 'Respectarea termenelor' },
    text: {
      ru: 'Мы планируем работы так, чтобы сдавать объекты в согласованные сроки.',
      ro: 'Planificăm lucrările astfel încât să predăm obiectele în termenele stabilite.',
    },
  },
];

export const values: Localized[] = [
  { ru: 'Качество', ro: 'Calitate' },
  { ru: 'Надёжность', ro: 'Fiabilitate' },
  { ru: 'Профессионализм', ro: 'Profesionalism' },
  { ru: 'Эстетика', ro: 'Estetică' },
  { ru: 'Комфорт', ro: 'Confort' },
  { ru: 'Внимание к деталям', ro: 'Atenție la detalii' },
  { ru: 'Долговечность', ro: 'Durabilitate' },
  { ru: 'Соблюдение стандартов', ro: 'Respectarea standardelor' },
];
