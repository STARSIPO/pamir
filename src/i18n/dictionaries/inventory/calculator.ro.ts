import type { calculatorRu } from './calculator.ru';

/** Inventory · calculator strings (RO). Must match the RU shape. */
export const calculatorRo: typeof calculatorRu = {
  eyebrow: 'Calculator',
  title: 'Calculați costul apartamentului dumneavoastră',
  subtitle:
    'Modificați parametrii — costul se recalculează imediat, la aceleași prețuri ca în fișele apartamentelor.',
  modesLabel: 'Tipul calculului',
  modes: { price: 'Costul', installment: 'În rate' },

  context: 'Pentru apartamentul nr. {n}',
  contextChanged: 'Parametrii au fost modificați',
  contextReset: 'Revino la apartamentul nr. {n}',

  fields: {
    project: 'Proiectul',
    building: 'Blocul',
    rooms: 'Camere',
    area: 'Suprafața',
    floor: 'Etajul',
    type: 'Tipul apartamentului',
    outdoor: 'Balcon sau terasă',
    outdoorArea: { balcony: 'Suprafața balconului', terrace: 'Suprafața terasei' },
    parking: 'Parcare',
  },
  floorOf: 'din {n}',
  parking: { none: 'Fără parcare', surface: 'La sol', underground: 'Subterană' },
  inputs: {
    area: 'Suprafața apartamentului, m²',
    floor: 'Etajul',
    outdoorArea: 'Suprafața balconului sau a terasei, m²',
    price: 'Costul apartamentului, €',
    downPercent: 'Avansul, %',
    downAmount: 'Avansul, €',
  },

  result: {
    title: 'Calculul dumneavoastră',
    area: 'Suprafața',
    pricePerSqm: 'Preț pe m²',
    outdoorShare: '{p}% din prețul pe m²',
    apartmentPrice: 'Costul apartamentului',
    parking: 'Loc de parcare',
    total: 'Total',
    installmentTeaser: 'În rate — ≈ {m} / lună',
    installmentTeaserHint: 'avans {d}% · {t} luni',
    toInstallment: 'Calculează plata în rate',
    lead: 'Lasă o cerere',
  },

  installment: {
    price: 'Costul',
    fromEstimate: 'Din calculul costului',
    resetPrice: 'Revino la {v}',
    downPayment: 'Avansul',
    downModeLabel: 'Avans în procente sau în euro',
    downModes: { percent: '%', amount: '€' },
    term: 'Termenul',
    months: 'luni',
    back: 'Modifică parametrii apartamentului',
  },

  installmentResult: {
    title: 'Plata în rate',
    down: 'Avans',
    remainder: 'Rest de plată',
    term: 'Termen',
    monthly: 'Rata lunară',
    perMonth: '/ lună',
    totalPaid: 'Total de plată',
    overpay: 'Plată suplimentară',
    interestFree: 'Fără dobândă — plata în rate de la dezvoltator',
    rate: 'Dobândă {r}% pe an',
  },
  installmentNote: 'Calculul este orientativ, condițiile finale se precizează cu managerul.',

  lead: {
    caption: 'Calcul din calculator',
    price: 'Calcul: {v} — total {t}',
    installment: 'în rate pe {n} luni: avans {d}% ({a}), ≈ {m} / lună',
    manualPrice: 'Calcul: cost {p}',
    parking: { surface: 'parcare la sol', underground: 'parcare subterană' },
  },

  sticky: { total: 'Total', monthly: 'Pe lună', details: 'Detalii' },
  announce: { total: 'Total {v}', monthly: 'Rata lunară {v}' },
};
