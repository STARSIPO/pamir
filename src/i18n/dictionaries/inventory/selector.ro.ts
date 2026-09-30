import type { selectorRu } from './selector.ru';

/** Inventory · selector strings (RO). Must match the RU shape. */
export const selectorRo: typeof selectorRu = {
  // Step 1 page — /projects/{slug}/select
  metaDescription:
    'Schema interactivă a complexului: alegeți blocul, etajul și apartamentul, vedeți planul, prețul și statusul apartamentului.',
  title: 'Alegeți blocul',
  lead: 'Apăsați pe un bloc pe schema complexului — vă arătăm numărul de etaje, apartamentele libere și prețurile. Apoi alegeți etajul, planul și calculați costul.',

  // Scheme
  schemeLabel: 'Schema complexului',
  hintPointer: 'Treceți cu mouse-ul peste un bloc pentru detalii. Faceți clic pentru a trece la etaje.',
  hintTouch: 'Atingeți un bloc pentru detalii și încă o dată pentru a trece la etaje.',
  north: 'N',
  legendTitle: 'Legendă',
  features: {
    courtyard: 'Curte',
    playground: 'Loc de joacă',
    green: 'Spațiu verde',
    parking: 'Parcare',
    road: 'Stradă',
    entrance: 'Intrare',
  },

  // Info panel and building cards
  complex: 'Complexul',
  summaryHint: 'Alegeți un bloc pe schemă sau din lista de mai jos — aici vor apărea numărul de etaje, apartamentele libere și prețurile.',
  buildingsCount: 'Blocuri',
  availableLabel: 'Apartamente libere',
  of: 'din',
  roomsLabel: 'Număr de camere',
  priceLabel: 'Preț',
  chooseFloor: 'Alege etajul',
  soldOut: 'Nu sunt apartamente libere',
  selected: 'Selectat',
  listTitle: 'Blocurile complexului',
  recommendCta: 'Selectare după criterii',

  // Touch, below lg: bar that slides up after the first tap on a building
  bar: {
    label: 'Blocul selectat',
    floors: { one: 'etaj', few: 'etaje', many: 'de etaje', other: 'de etaje' },
    available: 'Libere {available} din {total}',
    close: 'Închide',
  },

  // Project-page teaser block
  teaser: {
    title: 'Alegeți apartamentul pe schema interactivă',
    text: 'Blocul, etajul, planul și prețul — în câțiva pași. Apartamentele libere, rezervate și vândute se văd imediat.',
    available: 'Apartamente în vânzare',
    buildings: 'Blocuri',
    rooms: 'Număr de camere',
    price: 'Preț',
  },
};
