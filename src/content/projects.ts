import type { Project } from './types';

/**
 * Project catalogue. Structure mirrors a headless-CMS schema so the owner can
 * later edit these entries (or move them into Sanity/Payload) without touching
 * components.
 *
 * DATA POLICY: confirmed facts only. Anything unverified is set to a neutral
 * "уточняется / se precizează" value AND listed in `unconfirmed` for follow-up.
 * Descriptions are rewritten professionally — NOT copied from the old site.
 * Images are the developer's own renders and photos, taken from the legacy
 * pamirconstruct.md site (see docs/IMAGE-CREDITS.md). `coverKind: 'render'`
 * makes the UI caption the picture as a visualisation, never as a photo.
 *
 * Names are typeset: "Botanic Star 2 —" is tied with no-break spaces
 * ( ), so wherever a name wraps — footer, cards, form options — the
 * dash never opens a line and the "2" never leaves "Star".
 */

const TBD = { ru: 'Уточняется', ro: 'Se precizează' };

export const projects: Project[] = [
  {
    slug: 'botanic-star-2-blocks-3-4',
    name: { ru: 'Botanic Star 2 — блоки 3 и 4', ro: 'Botanic Star 2 — blocurile 3 și 4' },
    tagline: {
      ru: 'Современный жилой комплекс в секторе Ботаника',
      ro: 'Complex rezidențial modern în sectorul Botanica',
    },
    status: 'construction',
    district: { ru: 'Ботаника', ro: 'Botanica' },
    address: { ru: 'ул. Гика Водэ, 3', ro: 'str. Ghica Vodă, 3' },
    featured: true,
    // "-v2": the tighter re-crop (1300×1074) under a new URL, so no image
    // optimizer or browser cache keeps serving the old frame.
    cover: '/photos/projects/botanic-star-2-blocks-3-4/cover-v2.jpg',
    coverKind: 'render',
    gallery: [],
    excerpt: {
      ru: 'Завершающие блоки квартала Botanic Star 2 с закрытым двором, подземной парковкой и автономным отоплением.',
      ro: 'Blocurile finale ale cvartalului Botanic Star 2, cu curte închisă, parcare subterană și încălzire autonomă.',
    },
    description: [
      {
        ru: 'Botanic Star 2 продолжает застройку одного из самых зелёных секторов Кишинёва. Блоки 3 и 4 завершают архитектурный ансамбль квартала: сдержанные фасады, продуманные планировки и закрытая благоустроенная территория для жильцов.',
        ro: 'Botanic Star 2 continuă dezvoltarea unuia dintre cele mai verzi sectoare din Chișinău. Blocurile 3 și 4 completează ansamblul arhitectural al cvartalului: fațade sobre, planuri gândite și un teritoriu închis, amenajat pentru locatari.',
      },
      {
        ru: 'Комплекс рассчитан на комфортную повседневную жизнь: автономное отопление, тёплые полы, видеонаблюдение и подземный паркинг. Рядом — школы, детские сады, магазины и остановки общественного транспорта.',
        ro: 'Complexul este gândit pentru un trai comod: încălzire autonomă, pardoseli calde, supraveghere video și parcare subterană. În apropiere — școli, grădinițe, magazine și stații de transport public.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'В строительстве', ro: 'În construcție' } },
      { key: 'floors', label: { ru: 'Этажность', ro: 'Etaje' }, value: TBD },
      { key: 'rooms', label: { ru: 'Типы квартир', ro: 'Tipuri de apartamente' }, value: { ru: '1–3 комнаты', ro: '1–3 camere' } },
      { key: 'heating', label: { ru: 'Отопление', ro: 'Încălzire' }, value: { ru: 'Автономное', ro: 'Autonomă' } },
      { key: 'parking', label: { ru: 'Парковка', ro: 'Parcare' }, value: { ru: 'Подземная', ro: 'Subterană' } },
      { key: 'deadline', label: { ru: 'Срок сдачи', ro: 'Termen de dare în exploatare' }, value: TBD },
    ],
    advantages: [
      { icon: 'seismic', label: { ru: 'Сейсмостойкость', ro: 'Rezistență seismică' } },
      { icon: 'warm-floor', label: { ru: 'Тёплые полы', ro: 'Pardoseli calde' } },
      { icon: 'heating', label: { ru: 'Автономный котёл', ro: 'Cazan autonom' } },
      { icon: 'mortgage', label: { ru: 'Ипотека / Prima Casă', ro: 'Ipotecă / Prima Casă' } },
      { icon: 'closed-yard', label: { ru: 'Закрытый двор', ro: 'Curte închisă' } },
      { icon: 'video', label: { ru: 'Видеонаблюдение', ro: 'Supraveghere video' } },
      { icon: 'parking', label: { ru: 'Подземная парковка', ro: 'Parcare subterană' } },
      { icon: 'playground', label: { ru: 'Детская площадка', ro: 'Loc de joacă' } },
    ],
    floorplans: [
      { id: 'bs2-1r', rooms: 1, floor: TBD, available: false, status: 'unknown', placeholder: true },
      { id: 'bs2-2r', rooms: 2, floor: TBD, available: false, status: 'unknown', placeholder: true },
      { id: 'bs2-3r', rooms: 3, floor: TBD, available: false, status: 'unknown', placeholder: true },
    ],
    nearby: [
      { icon: 'school', label: { ru: 'Школы и детские сады', ro: 'Școli și grădinițe' } },
      { icon: 'store', label: { ru: 'Магазины и супермаркеты', ro: 'Magazine și supermarketuri' } },
      { icon: 'park', label: { ru: 'Парки и зелёные зоны', ro: 'Parcuri și zone verzi' } },
      { icon: 'transport', label: { ru: 'Остановки транспорта', ro: 'Stații de transport' } },
    ],
    mapQuery: 'str. Ghica Vodă 3, Chișinău, Moldova',
    unconfirmed: [
      'Этажность и срок сдачи — уточнить у застройщика.',
      'На старом сайте фигурировало «Всего квартир: 10» — проверить, действительно ли это количество квартир, а не блоков/этажей.',
      'Реальные планировки и площади — заменить плейсхолдеры после получения материалов.',
    ],
  },
  {
    slug: 'eco-house',
    name: { ru: 'Eco House', ro: 'Eco House' },
    tagline: {
      ru: 'Жилой комплекс комфорт-класса в секторе Телецентр',
      ro: 'Complex rezidențial de clasă confort în sectorul Telecentru',
    },
    status: 'construction',
    district: { ru: 'Телецентр', ro: 'Telecentru' },
    address: undefined,
    featured: true,
    cover: '/photos/projects/eco-house/cover.jpg',
    hero: '/photos/projects/eco-house/hero.jpg',
    coverKind: 'render',
    gallery: [
      '/photos/projects/eco-house/hero.jpg',
    ],
    excerpt: {
      ru: 'Комплекс комфорт-класса с автономным отоплением, тёплыми полами, подземной парковкой и озеленённым двором.',
      ro: 'Complex de clasă confort cu încălzire autonomă, pardoseli calde, parcare subterană și curte verde.',
    },
    description: [
      {
        ru: 'Eco House создаётся для тех, кто ценит спокойный ритм жизни рядом с центром. Комплекс комфорт-класса сочетает энергоэффективные инженерные решения с продуманной территорией — озеленённым двором и детской площадкой.',
        ro: 'Eco House este creat pentru cei care prețuiesc un ritm de viață liniștit aproape de centru. Complexul de clasă confort îmbină soluții inginerești eficiente energetic cu un teritoriu bine gândit — curte verde și loc de joacă.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'В строительстве', ro: 'În construcție' } },
      { key: 'class', label: { ru: 'Класс', ro: 'Clasă' }, value: { ru: 'Комфорт', ro: 'Confort' } },
      { key: 'floors', label: { ru: 'Этажность', ro: 'Etaje' }, value: TBD },
      { key: 'heating', label: { ru: 'Отопление', ro: 'Încălzire' }, value: { ru: 'Автономное', ro: 'Autonomă' } },
      { key: 'parking', label: { ru: 'Парковка', ro: 'Parcare' }, value: { ru: 'Подземная', ro: 'Subterană' } },
      { key: 'deadline', label: { ru: 'Срок сдачи', ro: 'Termen de dare în exploatare' }, value: TBD },
    ],
    advantages: [
      { icon: 'heating', label: { ru: 'Автономное отопление', ro: 'Încălzire autonomă' } },
      { icon: 'warm-floor', label: { ru: 'Тёплые полы', ro: 'Pardoseli calde' } },
      { icon: 'parking', label: { ru: 'Подземная парковка', ro: 'Parcare subterană' } },
      { icon: 'garden', label: { ru: 'Озеленённый двор', ro: 'Curte verde' } },
      { icon: 'playground', label: { ru: 'Детская площадка', ro: 'Loc de joacă' } },
    ],
    floorplans: [
      { id: 'eco-1r', rooms: 1, floor: TBD, available: false, status: 'unknown', placeholder: true },
      { id: 'eco-2r', rooms: 2, floor: TBD, available: false, status: 'unknown', placeholder: true },
      { id: 'eco-3r', rooms: 3, floor: TBD, available: false, status: 'unknown', placeholder: true },
    ],
    nearby: [
      { icon: 'store', label: { ru: 'Магазины рядом', ro: 'Magazine în apropiere' } },
      { icon: 'park', label: { ru: 'Зелёные зоны', ro: 'Zone verzi' } },
      { icon: 'transport', label: { ru: 'Транспорт', ro: 'Transport' } },
    ],
    mapQuery: 'Telecentru, Chișinău, Moldova',
    unconfirmed: [
      'Точный адрес, этажность и срок сдачи — уточнить у застройщика.',
      'Галерея и планировки — временные плейсхолдеры.',
    ],
  },
  {
    slug: 'botanic-star-2-block-2',
    name: { ru: 'Botanic Star 2 — блок 2', ro: 'Botanic Star 2 — blocul 2' },
    tagline: { ru: 'Завершённый блок квартала Botanic Star 2', ro: 'Bloc finalizat al cvartalului Botanic Star 2' },
    status: 'completed',
    district: { ru: 'Ботаника', ro: 'Botanica' },
    address: undefined,
    cover: '/photos/projects/botanic-star-2-block-2/cover.jpg',
    coverKind: 'render',
    gallery: [],
    excerpt: {
      ru: 'Сданный блок квартала Botanic Star 2 в обжитом зелёном районе Ботаника.',
      ro: 'Bloc finalizat al cvartalului Botanic Star 2, în sectorul verde și locuit Botanica.',
    },
    description: [
      {
        ru: 'Блок 2 — часть уже сданной очереди квартала Botanic Star 2. Дом заселён, двор благоустроен, вся инфраструктура сектора Ботаника — в шаговой доступности.',
        ro: 'Blocul 2 face parte din etapa deja finalizată a cvartalului Botanic Star 2. Blocul este locuit, curtea amenajată, iar întreaga infrastructură a sectorului Botanica se află la câțiva pași.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'Сдан', ro: 'Finalizat' } },
      { key: 'district', label: { ru: 'Район', ro: 'Sector' }, value: { ru: 'Ботаника', ro: 'Botanica' } },
      { key: 'heating', label: { ru: 'Отопление', ro: 'Încălzire' }, value: { ru: 'Автономное', ro: 'Autonomă' } },
      { key: 'parking', label: { ru: 'Парковка', ro: 'Parcare' }, value: { ru: 'Подземная', ro: 'Subterană' } },
    ],
    advantages: [
      { icon: 'closed-yard', label: { ru: 'Закрытый двор', ro: 'Curte închisă' } },
      { icon: 'parking', label: { ru: 'Подземная парковка', ro: 'Parcare subterană' } },
      { icon: 'video', label: { ru: 'Видеонаблюдение', ro: 'Supraveghere video' } },
      { icon: 'playground', label: { ru: 'Детская площадка', ro: 'Loc de joacă' } },
    ],
    floorplans: [],
    nearby: [
      { icon: 'school', label: { ru: 'Школы и сады', ro: 'Școli și grădinițe' } },
      { icon: 'store', label: { ru: 'Магазины', ro: 'Magazine' } },
      { icon: 'transport', label: { ru: 'Транспорт', ro: 'Transport' } },
    ],
    mapQuery: 'Botanica, Chișinău, Moldova',
    unconfirmed: ['Год сдачи и точный адрес — уточнить.', 'Фотографии сданного дома — добавить из архива.'],
  },
  {
    slug: 'botanic-star-2-block-1',
    name: { ru: 'Botanic Star 2 — блок 1', ro: 'Botanic Star 2 — blocul 1' },
    tagline: { ru: 'Завершённый блок квартала Botanic Star 2', ro: 'Bloc finalizat al cvartalului Botanic Star 2' },
    status: 'completed',
    district: { ru: 'Ботаника', ro: 'Botanica' },
    address: undefined,
    cover: '/photos/projects/botanic-star-2-block-1/cover.jpg',
    hero: '/photos/projects/botanic-star-2-block-1/cover.jpg',
    coverKind: 'render',
    // The tower stands right of centre in a 2000×924 render (x≈800–1440):
    // 60% centres it in portrait and square crops, whole width in frame.
    coverPosition: '60% 50%',
    gallery: [
      '/photos/projects/company/about.jpg',
    ],
    excerpt: {
      ru: 'Первый сданный блок квартала Botanic Star 2 в секторе Ботаника.',
      ro: 'Primul bloc finalizat al cvartalului Botanic Star 2, în sectorul Botanica.',
    },
    description: [
      {
        ru: 'Блок 1 открыл квартал Botanic Star 2. Дом полностью заселён и стал частью сложившейся жилой среды сектора Ботаника с развитой инфраструктурой.',
        ro: 'Blocul 1 a deschis cvartalul Botanic Star 2. Blocul este complet locuit și face parte din mediul rezidențial consolidat al sectorului Botanica, cu infrastructură dezvoltată.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'Сдан', ro: 'Finalizat' } },
      { key: 'district', label: { ru: 'Район', ro: 'Sector' }, value: { ru: 'Ботаника', ro: 'Botanica' } },
      { key: 'heating', label: { ru: 'Отопление', ro: 'Încălzire' }, value: { ru: 'Автономное', ro: 'Autonomă' } },
      { key: 'parking', label: { ru: 'Парковка', ro: 'Parcare' }, value: { ru: 'Подземная', ro: 'Subterană' } },
    ],
    advantages: [
      { icon: 'closed-yard', label: { ru: 'Закрытый двор', ro: 'Curte închisă' } },
      { icon: 'parking', label: { ru: 'Подземная парковка', ro: 'Parcare subterană' } },
      { icon: 'video', label: { ru: 'Видеонаблюдение', ro: 'Supraveghere video' } },
    ],
    floorplans: [],
    nearby: [
      { icon: 'school', label: { ru: 'Школы и сады', ro: 'Școli și grădinițe' } },
      { icon: 'store', label: { ru: 'Магазины', ro: 'Magazine' } },
      { icon: 'transport', label: { ru: 'Транспорт', ro: 'Transport' } },
    ],
    mapQuery: 'Botanica, Chișinău, Moldova',
    unconfirmed: ['Год сдачи и точный адрес — уточнить.', 'Фотографии — добавить из архива.'],
  },
  {
    slug: 'botanic-star',
    name: { ru: 'Botanic Star', ro: 'Botanic Star' },
    tagline: { ru: 'Завершённый жилой комплекс в секторе Ботаника', ro: 'Complex rezidențial finalizat în sectorul Botanica' },
    status: 'completed',
    district: { ru: 'Ботаника', ro: 'Botanica' },
    address: undefined,
    cover: '/photos/projects/botanic-star/cover.jpg',
    coverKind: 'photo',
    // A 1200×1803 worm's-eye shot with ~8% sky above the crown: anchor the
    // crop to the top so portrait and square frames keep the whole crown and
    // take the trim from the dark ground-floor windows.
    coverPosition: '50% 0%',
    gallery: [
      '/photos/projects/botanic-star/gallery-1.jpg',
      '/photos/projects/botanic-star/gallery-2.jpg',
      '/photos/projects/botanic-star/gallery-3.jpg',
      '/photos/projects/botanic-star/gallery-4.jpg',
    ],
    excerpt: {
      ru: 'Первый комплекс линейки Botanic — сданный дом в центре сектора Ботаника.',
      ro: 'Primul complex din linia Botanic — bloc finalizat în centrul sectorului Botanica.',
    },
    description: [
      {
        ru: 'Botanic Star дал название целой линейке проектов компании. Комплекс расположен в центральной части сектора Ботаника и полностью заселён.',
        ro: 'Botanic Star a dat numele unei întregi linii de proiecte ale companiei. Complexul este situat în partea centrală a sectorului Botanica și este complet locuit.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'Сдан', ro: 'Finalizat' } },
      { key: 'district', label: { ru: 'Район', ro: 'Sector' }, value: { ru: 'Ботаника (центр)', ro: 'Botanica (centru)' } },
    ],
    advantages: [
      { icon: 'closed-yard', label: { ru: 'Благоустроенный двор', ro: 'Curte amenajată' } },
      { icon: 'parking', label: { ru: 'Парковка', ro: 'Parcare' } },
    ],
    floorplans: [],
    nearby: [
      { icon: 'store', label: { ru: 'Магазины', ro: 'Magazine' } },
      { icon: 'transport', label: { ru: 'Транспорт', ro: 'Transport' } },
    ],
    mapQuery: 'Botanica, Chișinău, Moldova',
    unconfirmed: ['Год сдачи, адрес и характеристики — уточнить.', 'Фотографии — добавить из архива (сейчас используются снимки со старого сайта).'],
  },
  {
    slug: 'botanic-park',
    name: { ru: 'Botanic Park', ro: 'Botanic Park' },
    tagline: { ru: 'Завершённый жилой комплекс с развитой инфраструктурой', ro: 'Complex rezidențial finalizat cu infrastructură dezvoltată' },
    status: 'completed',
    district: { ru: 'Ботаника', ro: 'Botanica' },
    address: undefined,
    // The tree-framed facade study leads, cut at the source rather than by
    // object-position: "cover-v2" is gallery-1's original (1800px) with its
    // bottom 11.5% removed (white van, lamp heads, the red sale sign, car
    // roofs), 1800×1059. Cards up to 5:3 crop it only sideways; in 16:9 the
    // 4% overflow comes off the bottom (coverPosition), so the roofline stays
    // and no frame shape brings the street back. It is also the hero. The old
    // street shot (cover.jpg: leaning pole, cables, parked cars) is not used.
    // One spare picture, so About carries gallery-2 and there is no gallery.
    cover: '/photos/projects/botanic-park/cover-v2.jpg',
    coverKind: 'photo',
    coverPosition: '50% 0%',
    gallery: ['/photos/projects/botanic-park/gallery-2.jpg'],
    excerpt: {
      ru: 'Сданный комплекс с собственной инфраструктурой: детская площадка, супермаркет, парковка, детский сад.',
      ro: 'Complex finalizat cu infrastructură proprie: loc de joacă, supermarket, parcare, grădiniță.',
    },
    description: [
      {
        ru: 'Botanic Park — завершённый жилой комплекс с продуманной инфраструктурой прямо на территории: детская площадка, супермаркет, парковка и детский сад. Всё необходимое для повседневной жизни — рядом с домом.',
        ro: 'Botanic Park este un complex rezidențial finalizat, cu infrastructură bine gândită chiar pe teritoriu: loc de joacă, supermarket, parcare și grădiniță. Tot ce este necesar pentru viața de zi cu zi — lângă casă.',
      },
    ],
    specs: [
      { key: 'status', label: { ru: 'Статус', ro: 'Status' }, value: { ru: 'Сдан', ro: 'Finalizat' } },
      { key: 'district', label: { ru: 'Район', ro: 'Sector' }, value: { ru: 'Ботаника', ro: 'Botanica' } },
      { key: 'infra', label: { ru: 'Инфраструктура', ro: 'Infrastructură' }, value: { ru: 'Супермаркет, детсад', ro: 'Supermarket, grădiniță' } },
    ],
    advantages: [
      { icon: 'playground', label: { ru: 'Детская площадка', ro: 'Loc de joacă' } },
      { icon: 'store', label: { ru: 'Супермаркет', ro: 'Supermarket' } },
      { icon: 'parking', label: { ru: 'Парковка', ro: 'Parcare' } },
      { icon: 'kindergarten', label: { ru: 'Детский сад', ro: 'Grădiniță' } },
    ],
    floorplans: [],
    nearby: [
      { icon: 'store', label: { ru: 'Магазины', ro: 'Magazine' } },
      { icon: 'school', label: { ru: 'Детский сад', ro: 'Grădiniță' } },
      { icon: 'transport', label: { ru: 'Транспорт', ro: 'Transport' } },
    ],
    mapQuery: 'Botanica, Chișinău, Moldova',
    unconfirmed: ['Точный адрес и год сдачи — уточнить.', 'Фотографии — добавить.'],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  // Featured first, then the rest — keeps the homepage curated but complete.
  return [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}

export const projectSlugs = projects.map((p) => p.slug);
