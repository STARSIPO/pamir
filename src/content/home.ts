import type { Localized, Stat } from './types';
import { projects } from './projects';

/** Company stats. Counts are DERIVED from the real project list (truthful).
 *  Years-on-market and apartments-built are demo placeholders until confirmed. */
export function getStats(): Stat[] {
  const completed = projects.filter((p) => p.status === 'completed').length;
  const construction = projects.filter((p) => p.status === 'construction').length;
  return [
    { value: completed, label: { ru: 'Сданных объектов', ro: 'Obiecte finalizate' } },
    { value: construction, label: { ru: 'В строительстве', ro: 'În construcție' } },
    { value: 10, suffix: '+', label: { ru: 'Лет на рынке', ro: 'Ani pe piață' }, placeholder: true },
    { value: 500, suffix: '+', label: { ru: 'Квартир построено', ro: 'Apartamente construite' }, placeholder: true },
  ];
}

export interface Advantage {
  n: string;
  title: Localized;
  text: Localized;
}

/** "Why Pamir Construct" — editorial numbered list, not a grid of tiny cards. */
export const advantages: Advantage[] = [
  {
    n: '01',
    title: { ru: 'Полный цикл строительства', ro: 'Ciclu complet de construcție' },
    text: {
      ru: 'От проектирования до сдачи — одна команда и единая ответственность за результат.',
      ro: 'De la proiectare până la predare — o singură echipă și responsabilitate unică pentru rezultat.',
    },
  },
  {
    n: '02',
    title: { ru: 'Контроль качества', ro: 'Control al calității' },
    text: {
      ru: 'Проверяем материалы и работы на каждом этапе, следуя строительным стандартам.',
      ro: 'Verificăm materialele și lucrările la fiecare etapă, respectând standardele de construcție.',
    },
  },
  {
    n: '03',
    title: { ru: 'Продуманные планировки', ro: 'Planuri bine gândite' },
    text: {
      ru: 'Функциональные квартиры, в которых удобно жить каждый день.',
      ro: 'Apartamente funcționale, comode pentru viața de zi cu zi.',
    },
  },
  {
    n: '04',
    title: { ru: 'Развитая инфраструктура', ro: 'Infrastructură dezvoltată' },
    text: {
      ru: 'Закрытые дворы, парковки, детские площадки и всё необходимое рядом с домом.',
      ro: 'Curți închise, parcări, locuri de joacă și tot ce este necesar lângă casă.',
    },
  },
];

export interface QualityFeature {
  icon: string;
  label: Localized;
}

/** Construction-quality highlights. Presence per-project must be verified —
 *  here they describe the company's general approach. */
export const qualityFeatures: QualityFeature[] = [
  { icon: 'seismic', label: { ru: 'Сейсмостойкие конструкции', ro: 'Structuri antiseismice' } },
  { icon: 'heating', label: { ru: 'Автономное отопление', ro: 'Încălzire autonomă' } },
  { icon: 'warm-floor', label: { ru: 'Тёплые полы', ro: 'Pardoseli calde' } },
  { icon: 'facade', label: { ru: 'Качественные фасады', ro: 'Fațade de calitate' } },
  { icon: 'video', label: { ru: 'Видеонаблюдение', ro: 'Supraveghere video' } },
  { icon: 'closed-yard', label: { ru: 'Закрытые дворы', ro: 'Curți închise' } },
  { icon: 'parking', label: { ru: 'Подземные парковки', ro: 'Parcări subterane' } },
  { icon: 'insulation', label: { ru: 'Теплоизоляция', ro: 'Izolație termică' } },
];

export interface Step {
  n: string;
  title: Localized;
  text: Localized;
}

export const steps: Step[] = [
  {
    n: '01',
    title: { ru: 'Выбор комплекса', ro: 'Alegerea complexului' },
    text: { ru: 'Знакомитесь с проектами и выбираете подходящий комплекс.', ro: 'Vă familiarizați cu proiectele și alegeți complexul potrivit.' },
  },
  {
    n: '02',
    title: { ru: 'Консультация', ro: 'Consultație' },
    text: { ru: 'Менеджер отвечает на вопросы и подбирает варианты.', ro: 'Managerul răspunde la întrebări și selectează variantele.' },
  },
  {
    n: '03',
    title: { ru: 'Выбор квартиры', ro: 'Alegerea apartamentului' },
    text: { ru: 'Определяетесь с планировкой, этажом и площадью.', ro: 'Stabiliți planul, etajul și suprafața.' },
  },
  {
    n: '04',
    title: { ru: 'Способ оплаты', ro: 'Modul de plată' },
    text: { ru: 'Обсуждаете оплату: ипотека, Prima Casă или рассрочка.', ro: 'Discutați plata: ipotecă, Prima Casă sau în rate.' },
  },
  {
    n: '05',
    title: { ru: 'Оформление', ro: 'Perfectarea' },
    text: { ru: 'Готовим и подписываем документы по сделке.', ro: 'Pregătim și semnăm documentele tranzacției.' },
  },
  {
    n: '06',
    title: { ru: 'Получение ключей', ro: 'Primirea cheilor' },
    text: { ru: 'Получаете квартиру и ключи от нового дома.', ro: 'Primiți apartamentul și cheile noii locuințe.' },
  },
];
