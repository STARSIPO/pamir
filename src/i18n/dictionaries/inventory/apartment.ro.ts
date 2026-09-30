import type { apartmentRu } from './apartment.ru';

/** Inventory · apartment page strings (RO). Must match the RU shape. */
export const apartmentRo: typeof apartmentRu = {
  title: 'Apartamentul nr. {n}',
  crumb: 'Apartamentul {n}',
  crumbFloor: 'Etajul {n}',
  metaTitle: 'Apartamentul nr. {n} — {project}',
  metaDescription: '{rooms}, {area} m², etajul {floor}, {building}. Planul, prețul și cererea online.',
  eyebrow: '{building} · Etajul {floor}',
  summary: {
    kind: {
      1: 'Apartament cu o cameră',
      2: 'Apartament cu două camere',
      3: 'Apartament cu trei camere',
      4: 'Apartament cu patru camere',
    },
    penthouse: 'Penthouse',
    body: '{kind} cu o suprafață de {area} m², la etajul {floor} din {floors}.',
    balcony: 'Balcon de {area} m².',
    terrace: 'Terasă de {area} m².',
  },
  leadContext: 'Apartamentul nr. {n}, {building}, etajul {floor}',

  leadSection: {
    title: 'Cerere pentru apartamentul nr. {n}',
    lead: 'Managerul va confirma că apartamentul este liber, vă va răspunde la întrebări și vă va prezenta condițiile de cumpărare și de plată în rate.',
    leadReserved:
      'Apartamentul este rezervat acum. Lăsați o cerere — vă anunțăm dacă rezervarea se anulează și vă propunem variante similare.',
    submit: 'Trimiteți cererea',
    nextTitle: 'Ce urmează',
    next: [
      { title: 'Legătura cu managerul', text: 'Vă contactăm pe calea preferată — telefonic, pe WhatsApp sau pe Telegram.' },
      { title: 'Vizionarea', text: 'Stabilim o oră comodă, ca să vedeți pe viu apartamentul sau obiectul.' },
      {
        title: 'Condițiile de cumpărare',
        text: 'Calculăm plata în rate, vă ajutăm cu ipoteca, inclusiv prin programul Prima Casă, și pregătim documentele.',
      },
    ],
    nextReserved: [
      { title: 'Legătura cu managerul', text: 'Vă contactăm pe calea preferată — telefonic, pe WhatsApp sau pe Telegram.' },
      { title: 'Apartamente similare', text: 'Selectăm apartamente libere cu plan, suprafață și preț apropiate.' },
      { title: 'Dacă rezervarea se anulează', text: 'Vă anunțăm imediat ce apartamentul devine din nou disponibil.' },
    ],
  },

  pager: {
    label: 'Apartamentele etajului',
    prev: 'Apartamentul anterior de pe etaj: nr. {n}, {status}',
    next: 'Apartamentul următor de pe etaj: nr. {n}, {status}',
    position: '{i} din {total} pe etaj',
    backToFloor: 'Înapoi la planul etajului',
    backToFloorShort: 'Planul etajului',
  },

  viewer: {
    title: 'Planul apartamentului',
    modeLabel: 'Mod de vizualizare',
    mode2d: '2D',
    mode3d: '3D',
    soon: 'în curând',
    soonTitle: 'Modelul 3D al apartamentului — în curând',
    soonText:
      'Modelul volumetric al apartamentului, cu finisaje, moduri „zi” și „seară” și tur virtual, va apărea în următoarea actualizare. Deocamdată — planul 2D exact.',
    back2d: 'Vezi planul 2D',
    planAria: 'Planul apartamentului nr. {n}: {rooms}, {area} m². Încăperile pot fi evidențiate.',
    room: '{name} — {area} m²',
    entrance: 'Intrare',
    facade: 'Fațadă',
    north: 'N',
    northAria: 'Direcția nord',
    metre: 'm',
    scaleAria: 'Scara grafică: {n} m',
    hintHover: 'Treceți cu mouse-ul peste o încăpere pentru a o evidenția',
    hintTouch: 'Atingeți o încăpere pentru a o evidenția',
    explication: 'Lista încăperilor',
    indoorTotal: 'Suprafața totală',
  },

  facts: {
    title: 'Caracteristicile apartamentului',
    rooms: 'Camere',
    area: 'Suprafața',
    floor: 'Etajul',
    floorOf: 'din {n}',
    building: 'Blocul',
    bathrooms: 'Băi',
    type: 'Tipul',
    pricePerSqm: 'Preț pe m²',
    outdoorIncluded: {
      balcony: 'Include balconul de {area}, la {share}% din prețul pe m²',
      terrace: 'Include terasa de {area}, la {share}% din prețul pe m²',
    },
    total: 'Prețul apartamentului',
    features: 'Particularități',
  },

  actions: {
    lead: 'Lăsați o cerere',
    leadHint: 'Managerul vă va răspunde la întrebări și vă va prezenta condițiile de cumpărare',
    reservedLead: 'Aflați dacă se eliberează',
    reservedLeadShort: 'Întrebați de rezervare',
    calculate: 'Calculați prețul',
    calculateHint: 'Parcare, rate',
    download: 'Descărcați planul',
    downloadHint: 'SVG · pentru imprimare',
    downloadHintTouch: 'Se deschide pentru imprimare',
  },

  status: {
    reserved:
      'Apartamentul este rezervat. Lăsați o cerere — vă anunțăm dacă rezervarea se anulează și vă propunem variante similare.',
    sold: 'Acest apartament este vândut. Mai jos — apartamente similare încă disponibile.',
  },

  similar: {
    title: 'Apartamente similare disponibile',
    number: 'nr. {n}',
    item: '{rooms} · {area} m² · etajul {floor}',
    onFloor: 'Toate apartamentele de la etajul {n}',
    inBuilding: 'Alegeți etajul — {building}',
    none: 'Momentan nu există apartamente similare libere — alegeți alt etaj sau lăsați o cerere.',
  },

  file: {
    name: 'plan-apartament',
    generated: 'Generat la {date}',
    note: 'Plan schematic. Dimensiunile și suprafețele se precizează la departamentul de vânzări.',
    print: 'Imprimare sau PDF',
    save: 'Descărcați SVG',
  },
};
