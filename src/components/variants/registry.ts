import type { Localized } from '@/content/types';

export interface VariantMeta {
  key: 'catalog' | 'facade' | 'inventory';
  no: string;
  name: Localized;
  thesis: Localized;
  /** What the client has to supply before this direction can go live. */
  needs: Localized;
}

export const variants = [
  {
    key: 'catalog',
    no: '01',
    name: { ru: 'Каталог', ro: 'Catalog' },
    thesis: {
      ru: 'Оглавление архитектурной монографии. На первом экране ни одной фотографии — только типографика и список объектов со статусом.',
      ro: 'Cuprinsul unei monografii de arhitectură. Niciun fel de fotografie pe primul ecran — doar tipografie și lista obiectelor cu status.',
    },
    needs: {
      ru: 'Ничего. Работает на текущих данных.',
      ro: 'Nimic. Funcționează pe datele actuale.',
    },
  },
  {
    key: 'facade',
    no: '02',
    name: { ru: 'Фасад', ro: 'Fațadă' },
    thesis: {
      ru: 'Тёмный, во всю ширину, с крупной фотографией и тяжёлым гротеском. Язык, который покупатель уже видел у конкурентов.',
      ro: 'Întunecat, pe toată lățimea, cu fotografie mare și un grotesc greu. Limbajul pe care cumpărătorul l-a văzut deja la concurenți.',
    },
    needs: {
      ru: 'Фотоархив или рендеры. Без них направление не живёт.',
      ro: 'Arhivă foto sau randări. Fără ele direcția nu funcționează.',
    },
  },
  {
    key: 'inventory',
    no: '03',
    name: { ru: 'Инвентарь', ro: 'Inventar' },
    thesis: {
      ru: 'Главная перестаёт быть брошюрой и становится инструментом подбора: схема дома со статусами прямо на первом экране.',
      ro: 'Pagina principală nu mai este o broșură, ci un instrument de selecție: schema blocului cu statusuri chiar pe primul ecran.',
    },
    needs: {
      ru: 'Таблица остатков и человек, который её ведёт.',
      ro: 'Tabelul stocului și o persoană care îl menține.',
    },
  },
] as const satisfies readonly VariantMeta[];

export type VariantKey = VariantMeta['key'];

export function isVariant(value: string): value is VariantKey {
  return variants.some((v) => v.key === value);
}
