/**
 * DEMO NEWS — demonstration publications (client's request, 2026-10-01).
 *
 * Every article is `demo: true`: the UI marks it «Демо», it is noindex and
 * stays out of the sitemap. The texts describe the site, the published facts
 * of the projects (src/content/projects.ts) and general, non-committal
 * information — never company statements, achievements, completion dates or
 * events that a reader could take as real. Replace with real publications
 * (same shape, `demo: false`) or connect a CMS through src/lib/news/repository.ts.
 *
 * Images are the developer's own renders/photos (see docs/IMAGE-CREDITS.md)
 * and, where marked `illustration`, licensed stock used as atmosphere only.
 */
import type { NewsArticle } from '@/lib/news/types';

const P = '/photos/projects';

export const newsArticles: NewsArticle[] = [
  {
    id: 'n-2026-09-30-site',
    slug: 'noul-site-pamir-construct',
    title: { ru: 'Новый сайт Pamir Construct: выбор квартиры онлайн', ro: 'Noul site Pamir Construct: alegerea apartamentului online' },
    subtitle: {
      ru: 'Проекты, планировки и расчёт стоимости — в одном месте.',
      ro: 'Proiecte, planuri și calculul costului — într-un singur loc.',
    },
    description: {
      ru: 'Обновлённый сайт показывает проекты крупно, позволяет пройти путь от корпуса до квартиры и рассчитать стоимость.',
      ro: 'Site-ul actualizat prezintă proiectele pe larg, permite parcurgerea drumului de la bloc la apartament și calculul costului.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Сайт Pamir Construct получил новый дизайн и интерактивный выбор квартиры.',
          ro: 'Site-ul Pamir Construct a primit un design nou și alegerea interactivă a apartamentului.',
        },
      },
      { type: 'project', slug: 'botanic-star-2-blocks-3-4' },
    ],
    date: '2026-09-30',
    category: 'company',
    coverImage: {
      src: `${P}/eco-house/hero.jpg`,
      alt: { ru: 'Eco House, визуализация', ro: 'Eco House, vizualizare' },
      kind: 'render',
      width: 2000,
      height: 1125,
    },
    images: [],
    featured: true,
    author: { ru: 'Pamir Construct', ro: 'Pamir Construct' },
    status: 'published',
    demo: true,
  },
  {
    id: 'n-2026-09-15-bs2',
    slug: 'botanic-star-2-blocurile-3-4',
    title: { ru: 'Botanic Star 2: блоки 3 и 4', ro: 'Botanic Star 2: blocurile 3 și 4' },
    subtitle: { ru: 'Завершающие блоки квартала в секторе Ботаника.', ro: 'Blocurile finale ale cvartalului din sectorul Botanica.' },
    description: {
      ru: 'Закрытый двор, подземная парковка и автономное отопление — о чём важно знать покупателю.',
      ro: 'Curte închisă, parcare subterană și încălzire autonomă — ce trebuie să știe cumpărătorul.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Блоки 3 и 4 завершают архитектурный ансамбль квартала Botanic Star 2.',
          ro: 'Blocurile 3 și 4 completează ansamblul arhitectural al cvartalului Botanic Star 2.',
        },
      },
    ],
    date: '2026-09-15',
    category: 'projects',
    coverImage: {
      src: `${P}/botanic-star-2-blocks-3-4/cover-v2.jpg`,
      alt: { ru: 'Botanic Star 2, блоки 3 и 4, визуализация', ro: 'Botanic Star 2, blocurile 3 și 4, vizualizare' },
      kind: 'render',
      width: 1300,
      height: 1074,
    },
    images: [],
    relatedProject: 'botanic-star-2-blocks-3-4',
    status: 'published',
    demo: true,
  },
  {
    id: 'n-2026-08-28-eco',
    slug: 'eco-house-telecentru',
    title: { ru: 'Eco House: комфорт-класс в секторе Телецентр', ro: 'Eco House: clasa confort în sectorul Telecentru' },
    subtitle: { ru: 'Спокойный ритм жизни рядом с центром.', ro: 'Un ritm de viață liniștit aproape de centru.' },
    description: {
      ru: 'Автономное отопление, тёплые полы и озеленённый двор — что предусмотрено в проекте.',
      ro: 'Încălzire autonomă, pardoseli calde și curte verde — ce prevede proiectul.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Eco House — комплекс комфорт-класса в секторе Телецентр.',
          ro: 'Eco House este un complex de clasă confort în sectorul Telecentru.',
        },
      },
    ],
    date: '2026-08-28',
    category: 'projects',
    coverImage: {
      src: `${P}/eco-house/cover.jpg`,
      alt: { ru: 'Eco House, визуализация', ro: 'Eco House, vizualizare' },
      kind: 'render',
      width: 1000,
      height: 1161,
    },
    images: [],
    relatedProject: 'eco-house',
    status: 'published',
    demo: true,
  },
  {
    id: 'n-2026-07-10-stages',
    slug: 'etapele-constructiei-unui-bloc',
    title: { ru: 'Этапы строительства жилого дома', ro: 'Etapele construcției unui bloc locativ' },
    subtitle: { ru: 'От фундамента до сдачи — коротко о главном.', ro: 'De la fundație până la dare în exploatare — pe scurt.' },
    description: {
      ru: 'Как устроен путь дома от котлована до ключей и на что смотреть покупателю на каждом этапе.',
      ro: 'Cum arată drumul unei clădiri de la groapa de fundație până la chei și la ce să fie atent cumpărătorul.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Строительство многоквартирного дома проходит несколько последовательных этапов.',
          ro: 'Construcția unui bloc de locuințe trece prin mai multe etape succesive.',
        },
      },
    ],
    date: '2026-07-10',
    category: 'construction',
    coverImage: {
      src: '/photos/quality-site.jpg',
      alt: { ru: 'Строительная площадка, иллюстрация', ro: 'Șantier de construcție, ilustrație' },
      kind: 'illustration',
      width: 1600,
      height: 1067,
    },
    images: [],
    status: 'published',
    demo: true,
  },
  {
    id: 'n-2026-05-20-mortgage',
    slug: 'ipoteca-si-prima-casa',
    title: { ru: 'Ипотека и Prima Casă: с чего начать', ro: 'Ipoteca și Prima Casă: de unde să începeți' },
    subtitle: { ru: 'Короткий путеводитель для покупателя квартиры.', ro: 'Un scurt ghid pentru cumpărătorul de apartament.' },
    description: {
      ru: 'Какие документы подготовить и какие вопросы задать банку и отделу продаж до выбора квартиры.',
      ro: 'Ce documente să pregătiți și ce întrebări să adresați băncii și departamentului de vânzări înainte de a alege apartamentul.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Условия ипотеки и программы Prima Casă уточняются в банке и в отделе продаж.',
          ro: 'Condițiile ipotecii și ale programului Prima Casă se precizează la bancă și la departamentul de vânzări.',
        },
      },
    ],
    date: '2026-05-20',
    category: 'company',
    coverImage: {
      src: '/photos/interior-living.jpg',
      alt: { ru: 'Интерьер гостиной, иллюстрация', ro: 'Interior de living, ilustrație' },
      kind: 'illustration',
      width: 1800,
      height: 1200,
    },
    images: [],
    status: 'published',
    demo: true,
  },
  {
    id: 'n-2025-10-14-city',
    slug: 'la-multi-ani-chisinau',
    title: { ru: 'С днём города, Кишинёв!', ro: 'La mulți ani, Chișinău!' },
    subtitle: { ru: 'Поздравляем жителей с праздником.', ro: 'Felicităm locuitorii cu ocazia sărbătorii.' },
    description: {
      ru: 'Город, в котором мы строим, — поздравление с праздником.',
      ro: 'Orașul în care construim — felicitări de sărbătoare.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Поздравляем всех жителей Кишинёва с днём города.',
          ro: 'Felicităm toți locuitorii Chișinăului cu ziua orașului.',
        },
      },
    ],
    date: '2025-10-14',
    category: 'events',
    coverImage: {
      src: `${P}/botanic-star-2-block-1/cover.jpg`,
      alt: { ru: 'Botanic Star 2, блок 1, визуализация', ro: 'Botanic Star 2, blocul 1, vizualizare' },
      kind: 'render',
      width: 2000,
      height: 924,
    },
    images: [],
    status: 'published',
    demo: true,
  },
];
