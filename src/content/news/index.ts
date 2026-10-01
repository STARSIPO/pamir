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
 * What the bodies may say: project facts only as src/content/projects.ts
 * states them (unconfirmed values stay "уточняется"), site features that
 * exist in this repo, and general information phrased as general (typical
 * construction stages, documents a bank usually asks for). No numbers,
 * prices, deadlines, progress reports, banks, rates or invented quotes; the
 * two quotes are lines of the site's own copy (hero title, quality title).
 *
 * Images are the developer's own renders/photos (see docs/IMAGE-CREDITS.md)
 * and, where marked `illustration`, licensed stock used as atmosphere only.
 * `width`/`height` are the files' real pixel sizes.
 */
import type { NewsArticle, NewsImage } from '@/lib/news/types';

const P = '/photos/projects';

/** Images used by more than one article. */
const IMG = {
  botanicParkFacade: {
    src: `${P}/botanic-park/cover-v2.jpg`,
    alt: {
      ru: 'Botanic Park: жёлтый фасад многоэтажного дома с французскими балконами, слева — ветви ивы',
      ro: 'Botanic Park: fațada galbenă a unui bloc cu mai multe etaje și balcoane franțuzești, în stânga — crengi de salcie',
    },
    caption: { ru: 'Botanic Park — сданный комплекс, фото', ro: 'Botanic Park — complex finalizat, foto' },
    kind: 'photo',
    width: 1800,
    height: 1059,
  },
  bs2Block2: {
    src: `${P}/botanic-star-2-block-2/cover.jpg`,
    alt: {
      ru: 'Botanic Star 2, блок 2: многоэтажный дом с бело-графитовым фасадом и жёлтыми вертикальными акцентами среди деревьев',
      ro: 'Botanic Star 2, blocul 2: bloc cu mai multe etaje, cu fațadă alb-grafit și accente verticale galbene, printre copaci',
    },
    caption: { ru: 'Botanic Star 2, блок 2 — визуализация', ro: 'Botanic Star 2, blocul 2 — vizualizare' },
    kind: 'render',
    width: 1400,
    height: 1018,
  },
} satisfies Record<string, NewsImage>;

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
      ro: 'Site-ul actualizat prezintă proiectele în format mare, permite parcurgerea drumului de la bloc la apartament și calculul costului.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: 'Сайт Pamir Construct обновился. Проекты теперь показаны крупно, а путь от жилого комплекса до конкретной квартиры можно пройти онлайн — в несколько шагов, с планировкой и расчётом стоимости. Рассказываем, что появилось и как этим пользоваться.',
          ro: 'Site-ul Pamir Construct s-a înnoit. Proiectele sunt prezentate acum în format mare, iar drumul de la complexul rezidențial până la un anumit apartament poate fi parcurs online — în câțiva pași, cu planul și calculul costului. Vă spunem ce s-a schimbat și cum să folosiți noutățile.',
        },
      },
      { type: 'heading', text: { ru: 'Каталог проектов', ro: 'Catalogul proiectelor' } },
      {
        type: 'paragraph',
        text: {
          ru: 'В разделе «Проекты» собраны все жилые комплексы компании — строящиеся и сданные, с фильтром по статусу. На странице проекта — описание, преимущества и расположение на карте с кнопкой «Построить маршрут», а у строящихся проектов — ещё и типы квартир. Новости, связанные с проектом, выводятся прямо на его странице.',
          ro: 'În secțiunea „Proiecte” sunt adunate toate complexele rezidențiale ale companiei — în construcție și finalizate, cu filtru după status. Pe pagina proiectului găsiți descrierea, avantajele și amplasarea pe hartă cu butonul „Trasează ruta”, iar la proiectele în construcție — și tipurile de apartamente. Noutățile legate de proiect apar direct pe pagina lui.',
        },
      },
      { type: 'gallery', images: [IMG.botanicParkFacade, IMG.bs2Block2] },
      { type: 'heading', text: { ru: 'Квартира — в четыре шага', ro: 'Apartamentul — în patru pași' } },
      {
        type: 'list',
        ordered: true,
        items: [
          {
            ru: 'Комплекс. На интерактивной схеме видны корпуса, двор и парковка. Наведите курсор или нажмите на корпус — появятся его этажность, свободные квартиры и цены.',
            ro: 'Complexul. Pe schema interactivă se văd blocurile, curtea și parcarea. Treceți cu mouse-ul peste un bloc sau apăsați pe el — apar numărul de etaje, apartamentele libere și prețurile.',
          },
          {
            ru: 'Корпус. На фасаде корпуса отмечены этажи и количество свободных квартир на каждом из них.',
            ro: 'Blocul. Pe fațada blocului sunt marcate etajele și numărul de apartamente libere de pe fiecare.',
          },
          {
            ru: 'Этаж. План этажа показывает все квартиры и их статус: доступна, забронирована или продана.',
            ro: 'Etajul. Planul etajului arată toate apartamentele și statusul lor: disponibil, rezervat sau vândut.',
          },
          {
            ru: 'Квартира. На отдельной странице — 2D-планировка с площадями помещений, характеристики, стоимость и форма заявки.',
            ro: 'Apartamentul. Pe o pagină separată — planul 2D cu suprafețele încăperilor, caracteristicile, costul și formularul de cerere.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'На плане можно выделить любое помещение и сверить его площадь в экспликации, а саму планировку — скачать для печати. Если квартира уже продана, ниже появятся похожие доступные варианты.',
          ro: 'Pe plan puteți evidenția orice încăpere și verifica suprafața ei în lista încăperilor, iar planul îl puteți descărca pentru imprimare. Dacă apartamentul este deja vândut, mai jos apar variante similare disponibile.',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Калькулятор считает ориентировочную стоимость квартиры по проекту, корпусу, числу комнат, площади, этажу, балкону или террасе и парковке. Во вкладке «Рассрочка» можно задать первый взнос и срок и увидеть ежемесячный платёж. А если удобнее начать с бюджета, подбор по параметрам покажет квартиры, которые подходят лучше всего, и объяснит почему.',
          ro: 'Calculatorul estimează costul apartamentului după proiect, bloc, numărul de camere, suprafață, etaj, balcon sau terasă și parcare. În fila „În rate” puteți stabili avansul și termenul și vedea plata lunară. Iar dacă vă este mai comod să porniți de la buget, selecția după parametri vă arată apartamentele care se potrivesc cel mai bine și vă explică de ce.',
        },
      },
      {
        type: 'project',
        slug: 'botanic-star-2-blocks-3-4',
        text: {
          ru: 'Выбор квартиры на схеме и калькулятор уже работают на странице проекта — пока на демонстрационных данных.',
          ro: 'Alegerea apartamentului pe schemă și calculatorul funcționează deja pe pagina proiectului — deocamdată cu date demonstrative.',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Этажность, планировки, цены и статусы квартир в этих инструментах сейчас демонстрационные и показывают, как работает сервис. Актуальное наличие и окончательную стоимость уточняйте в отделе продаж: оставьте заявку на сайте — менеджер свяжется с вами.',
          ro: 'Numărul de etaje, planurile, prețurile și statusurile apartamentelor din aceste instrumente sunt deocamdată demonstrative și arată cum funcționează serviciul. Disponibilitatea reală și costul final le aflați la departamentul de vânzări: lăsați o cerere pe site — managerul vă va contacta.',
        },
      },
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
          ru: 'Botanic Star 2 — квартал Pamir Construct в секторе Ботаника, одном из самых зелёных в Кишинёве. Первые два блока уже сданы и заселены, а блоки 3 и 4 строятся на ул. Гика Водэ, 3 и завершат архитектурный ансамбль квартала.',
          ro: 'Botanic Star 2 este cvartalul Pamir Construct din sectorul Botanica, unul dintre cele mai verzi din Chișinău. Primele două blocuri sunt deja finalizate și locuite, iar blocurile 3 și 4 se construiesc pe str. Ghica Vodă, 3 și vor completa ansamblul arhitectural al cvartalului.',
        },
      },
      { type: 'heading', text: { ru: 'Квартал, который строится очередями', ro: 'Un cvartal care se construiește pe etape' } },
      {
        type: 'paragraph',
        text: {
          ru: 'Блок 1 открыл квартал и полностью заселён. Блок 2 тоже сдан: дом заселён, двор благоустроен. Блоки 3 и 4 продолжают эту линию — сдержанные фасады, продуманные планировки и закрытая благоустроенная территория для жильцов.',
          ro: 'Blocul 1 a deschis cvartalul și este complet locuit. Blocul 2 este de asemenea finalizat: blocul este locuit, iar curtea — amenajată. Blocurile 3 și 4 continuă aceeași linie — fațade sobre, planuri bine gândite și un teritoriu închis, amenajat pentru locatari.',
        },
      },
      {
        type: 'gallery',
        images: [
          {
            src: `${P}/botanic-star-2-block-1/cover.jpg`,
            alt: {
              ru: 'Botanic Star 2, блок 1: многоэтажный дом с белым фасадом и жёлто-графитовыми акцентами, перед ним — сквер и детская площадка в закатном свете',
              ro: 'Botanic Star 2, blocul 1: bloc cu fațadă albă și accente galben-grafit, în față — un scuar și un loc de joacă în lumina apusului',
            },
            caption: { ru: 'Botanic Star 2, блок 1 — визуализация', ro: 'Botanic Star 2, blocul 1 — vizualizare' },
            kind: 'render',
            width: 2000,
            height: 924,
          },
          {
            src: `${P}/company/about.jpg`,
            alt: {
              ru: 'Botanic Star 2, блок 1: дом среди деревьев, перед ним — извилистые дорожки, фонари и скамейки',
              ro: 'Botanic Star 2, blocul 1: blocul printre copaci, în față — alei șerpuite, felinare și bănci',
            },
            caption: { ru: 'Botanic Star 2, блок 1, вид из сквера — визуализация', ro: 'Botanic Star 2, blocul 1, vedere din scuar — vizualizare' },
            kind: 'render',
            width: 1600,
            height: 900,
          },
          IMG.bs2Block2,
        ],
      },
      { type: 'heading', text: { ru: 'Что предусмотрено в проекте', ro: 'Ce prevede proiectul' } },
      {
        type: 'list',
        items: [
          { ru: 'Квартиры от одной до трёх комнат', ro: 'Apartamente cu una, două sau trei camere' },
          { ru: 'Автономное отопление и тёплые полы', ro: 'Încălzire autonomă și pardoseli calde' },
          { ru: 'Подземная парковка', ro: 'Parcare subterană' },
          { ru: 'Закрытый двор с детской площадкой', ro: 'Curte închisă cu loc de joacă' },
          { ru: 'Видеонаблюдение', ro: 'Supraveghere video' },
          { ru: 'Сейсмостойкие конструкции', ro: 'Structuri antiseismice' },
          { ru: 'Покупка в ипотеку, в том числе по программе Prima Casă', ro: 'Achiziție în ipotecă, inclusiv prin programul Prima Casă' },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Рядом с комплексом — школы и детские сады, магазины и супермаркеты, парки и зелёные зоны, остановки общественного транспорта. Ботаника — обжитой сектор с развитой инфраструктурой.',
          ro: 'În apropierea complexului — școli și grădinițe, magazine și supermarketuri, parcuri și zone verzi, stații de transport public. Botanica este un sector locuit de mult, cu infrastructură dezvoltată.',
        },
      },
      {
        type: 'project',
        slug: 'botanic-star-2-blocks-3-4',
        text: {
          ru: 'Схема комплекса, выбор квартиры и калькулятор стоимости — на странице проекта.',
          ro: 'Schema complexului, alegerea apartamentului și calculatorul costului — pe pagina proiectului.',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Этажность и срок сдачи блоков 3 и 4 пока уточняются, а планировки, цены и статусы квартир в выборе на схеме — демонстрационные. Актуальные данные о свободных квартирах и условиях покупки сообщает отдел продаж.',
          ro: 'Numărul de etaje și termenul de dare în exploatare a blocurilor 3 și 4 se precizează, iar planurile, prețurile și statusurile apartamentelor din schema interactivă sunt demonstrative. Datele actuale despre apartamentele libere și condițiile de achiziție le oferă departamentul de vânzări.',
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
          ru: 'Eco House — жилой комплекс комфорт-класса, который Pamir Construct строит в секторе Телецентр. Проект задуман для тех, кто ценит спокойный ритм жизни, но не хочет жить далеко от центра.',
          ro: 'Eco House este un complex rezidențial de clasă confort, pe care Pamir Construct îl construiește în sectorul Telecentru. Proiectul este gândit pentru cei care prețuiesc un ritm de viață liniștit, dar nu vor să locuiască departe de centru.',
        },
      },
      {
        type: 'list',
        items: [
          { ru: 'Класс — комфорт', ro: 'Clasa — confort' },
          { ru: 'Автономное отопление', ro: 'Încălzire autonomă' },
          { ru: 'Тёплые полы', ro: 'Pardoseli calde' },
          { ru: 'Подземная парковка', ro: 'Parcare subterană' },
          { ru: 'Озеленённый двор и детская площадка', ro: 'Curte verde și loc de joacă' },
          { ru: 'Рядом — магазины, зелёные зоны и транспорт', ro: 'În apropiere — magazine, zone verzi și transport' },
        ],
      },
      {
        type: 'image',
        wide: true,
        image: {
          src: `${P}/eco-house/hero.jpg`,
          alt: {
            ru: 'Eco House: многоэтажный дом со светлым фасадом, панорамными окнами и оранжевыми акцентами, рядом — улица, деревья и газон',
            ro: 'Eco House: bloc cu mai multe etaje, cu fațadă deschisă la culoare, ferestre panoramice și accente portocalii, alături — strada, copaci și gazon',
          },
          caption: { ru: 'Eco House — визуализация', ro: 'Eco House — vizualizare' },
          kind: 'render',
          width: 2000,
          height: 1125,
        },
      },
      { type: 'heading', text: { ru: 'Тепло и инженерные решения', ro: 'Căldură și soluții inginerești' } },
      {
        type: 'paragraph',
        text: {
          ru: 'В проекте предусмотрены автономное отопление и тёплые полы. Автономное отопление, как правило, не зависит от графика городской теплосети. Как устроены отопление и тёплые полы именно в Eco House, расскажут в отделе продаж.',
          ro: 'Proiectul prevede încălzire autonomă și pardoseli calde. Încălzirea autonomă, de regulă, nu depinde de graficul rețelei termice a orașului. Cum sunt organizate concret încălzirea și pardoselile calde la Eco House vă vor spune la departamentul de vânzări.',
        },
      },
      { type: 'heading', text: { ru: 'Двор и территория', ro: 'Curtea și teritoriul' } },
      {
        type: 'paragraph',
        text: {
          ru: 'Территория продумана вместе с домом: озеленённый двор и детская площадка. Для автомобилей предусмотрена подземная парковка. Рядом с комплексом — магазины, зелёные зоны и остановки транспорта.',
          ro: 'Teritoriul este gândit împreună cu blocul: curte verde și loc de joacă. Pentru automobile este prevăzută parcare subterană. În apropierea complexului — magazine, zone verzi și stații de transport.',
        },
      },
      {
        type: 'project',
        slug: 'eco-house',
        text: {
          ru: 'Описание, преимущества и калькулятор стоимости — на странице проекта.',
          ro: 'Descrierea, avantajele și calculatorul costului — pe pagina proiectului.',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Точный адрес, этажность и срок сдачи Eco House пока уточняются, а цены в калькуляторе на странице проекта — демонстрационные. Актуальную информацию о квартирах и условиях покупки даёт отдел продаж.',
          ro: 'Adresa exactă, numărul de etaje și termenul de dare în exploatare ale complexului Eco House se precizează, iar prețurile din calculatorul de pe pagina proiectului sunt demonstrative. Informația actuală despre apartamente și condițiile de achiziție o oferă departamentul de vânzări.',
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
          ru: 'Строительство многоквартирного дома — цепочка последовательных этапов, и у каждого свои задачи. Зная их, покупателю проще понять, что происходит на площадке, и задать застройщику точные вопросы. Ниже — общая схема: на конкретном объекте порядок работ и сроки зависят от проекта.',
          ro: 'Construcția unui bloc locativ este un șir de etape succesive, fiecare cu sarcinile sale. Când le cunoaște, cumpărătorul înțelege mai ușor ce se întâmplă pe șantier și poate adresa dezvoltatorului întrebări precise. Mai jos — schema generală: la un șantier concret, ordinea lucrărilor și termenele depind de proiect.',
        },
      },
      { type: 'heading', text: { ru: 'Основные этапы', ro: 'Etapele principale' } },
      {
        type: 'list',
        ordered: true,
        items: [
          {
            ru: 'Проект и разрешения. Инженерно-геологические изыскания, архитектурные и инженерные разделы проекта, разрешительная документация на строительство.',
            ro: 'Proiectul și autorizațiile. Studiile geotehnice, părțile de arhitectură și inginerie ale proiectului, documentele de autorizare a construcției.',
          },
          {
            ru: 'Подготовка площадки и котлован. Ограждение, временные дороги и сети, земляные работы.',
            ro: 'Pregătirea șantierului și groapa de fundație. Împrejmuirea, drumurile și rețelele provizorii, lucrările de terasament.',
          },
          {
            ru: 'Фундамент. Его тип выбирают по свойствам грунта и расчётам конструкторов.',
            ro: 'Fundația. Tipul ei se alege în funcție de proprietățile solului și de calculele proiectanților.',
          },
          {
            ru: 'Каркас и стены. Дом растёт этаж за этажом. Кишинёв находится в сейсмически активной зоне, поэтому конструкции рассчитывают с учётом сейсмических нагрузок.',
            ro: 'Structura și pereții. Blocul crește etaj cu etaj. Chișinăul se află într-o zonă seismică activă, de aceea structurile se calculează ținând cont de încărcările seismice.',
          },
          {
            ru: 'Кровля, окна и наружные стены. Так закрывают тепловой контур дома, чтобы внутренние работы не зависели от погоды.',
            ro: 'Acoperișul, ferestrele și pereții exteriori. Se închide anvelopa clădirii, ca lucrările interioare să nu depindă de vreme.',
          },
          {
            ru: 'Инженерные системы. Отопление, водоснабжение и канализация, электрика, вентиляция, лифты.',
            ro: 'Sistemele inginerești. Încălzirea, apa și canalizarea, rețeaua electrică, ventilația, ascensoarele.',
          },
          {
            ru: 'Фасад и благоустройство. Утепление и отделка фасада, двор, детские площадки, озеленение, парковка.',
            ro: 'Fațada și amenajarea. Izolarea termică și finisarea fațadei, curtea, locurile de joacă, spațiile verzi, parcarea.',
          },
          {
            ru: 'Приёмка и ввод в эксплуатацию. Дом проверяют на соответствие проекту и нормам, после чего квартиры передают владельцам.',
            ro: 'Recepția și darea în exploatare. Blocul este verificat pentru conformitatea cu proiectul și normele, după care apartamentele sunt predate proprietarilor.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Многое из того, что определяет качество дома, после сдачи уже не увидеть: фундамент, армирование, гидроизоляция, разводка инженерных сетей. Поэтому скрытые работы принято проверять поэтапно — до того, как их закроют следующие слои.',
          ro: 'Mare parte din ceea ce determină calitatea unui bloc nu se mai vede după darea în exploatare: fundația, armătura, hidroizolația, traseele rețelelor inginerești. De aceea, lucrările ascunse se verifică, de regulă, pe etape — înainte ca ele să fie acoperite de straturile următoare.',
        },
      },
      {
        type: 'quote',
        text: { ru: 'Внимание к тому, что не видно на фасаде', ro: 'Atenție la ceea ce nu se vede pe fațadă' },
        cite: { ru: 'Pamir Construct', ro: 'Pamir Construct' },
      },
      {
        type: 'image',
        image: {
          src: `${P}/botanic-star/gallery-1.jpg`,
          alt: {
            ru: 'Двор Botanic Star: дорожка из тротуарной плитки вдоль дома, детская площадка на искусственном газоне и стена, расписанная граффити',
            ro: 'Curtea Botanic Star: alee din pavele de-a lungul blocului, loc de joacă pe gazon artificial și un perete pictat cu graffiti',
          },
          caption: { ru: 'Двор сданного комплекса Botanic Star — фото', ro: 'Curtea complexului finalizat Botanic Star — foto' },
          kind: 'photo',
          width: 1600,
          height: 1065,
        },
      },
      { type: 'heading', text: { ru: 'Что спросить у застройщика', ro: 'Ce să întrebați dezvoltatorul' } },
      {
        type: 'list',
        items: [
          {
            ru: 'Какие разрешительные документы есть у объекта и на каком этапе сейчас стройка?',
            ro: 'Ce documente de autorizare are obiectul și la ce etapă se află acum construcția?',
          },
          {
            ru: 'Какая у дома конструктивная схема и как учтена сейсмостойкость?',
            ro: 'Ce sistem constructiv are blocul și cum este asigurată rezistența seismică?',
          },
          {
            ru: 'Какая система отопления и что входит в комплектацию квартиры?',
            ro: 'Ce sistem de încălzire are blocul și ce include finisajul apartamentului?',
          },
          {
            ru: 'Какой ожидаемый срок сдачи и как он закреплён в договоре?',
            ro: 'Care este termenul estimat de dare în exploatare și cum este fixat în contract?',
          },
          {
            ru: 'Можно ли посетить объект и посмотреть уже сданные дома застройщика?',
            ro: 'Se poate vizita obiectul și se pot vedea blocurile deja finalizate ale dezvoltatorului?',
          },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Эти вопросы можно задать отделу продаж Pamir Construct — менеджер также согласует удобное время, чтобы вы увидели объект вживую.',
          ro: 'Aceste întrebări le puteți adresa departamentului de vânzări Pamir Construct — managerul va stabili și o oră comodă ca să vedeți obiectul.',
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
          ru: 'Квартиру в новостройке не обязательно оплачивать сразу всей суммой. Обычно рассматривают два пути: банковскую ипотеку — в том числе по государственной программе Prima Casă — или рассрочку от застройщика. Разберём, с чего начать, какие документы обычно нужны и о чём спросить заранее.',
          ro: 'Apartamentul într-un bloc nou nu trebuie neapărat achitat dintr-odată. De obicei se iau în calcul două căi: ipoteca bancară — inclusiv prin programul de stat Prima Casă — sau plata în rate de la dezvoltator. Vă explicăm de unde să începeți, ce documente sunt necesare de obicei și ce să întrebați din timp.',
        },
      },
      {
        type: 'list',
        items: [
          {
            ru: 'Ипотека. Банк кредитует покупку, квартира становится залогом. Первый взнос, ставку и срок определяет банк. Ипотеку можно оформить и по государственной программе Prima Casă: кто может в ней участвовать и на каких условиях, определяют правила программы и банк.',
            ro: 'Ipoteca. Banca finanțează achiziția, iar apartamentul devine gaj. Avansul, dobânda și termenul le stabilește banca. Ipoteca poate fi obținută și prin programul de stat Prima Casă: cine poate participa și în ce condiții stabilesc regulile programului și banca.',
          },
          {
            ru: 'Рассрочка от застройщика. Оплата частями по графику; первый взнос и срок обсуждаются с отделом продаж.',
            ro: 'Plata în rate de la dezvoltator. Achitarea în tranșe, după un grafic; avansul și termenul se discută cu departamentul de vânzări.',
          },
        ],
      },
      { type: 'heading', text: { ru: 'Как обычно выглядит путь', ro: 'Cum arată de obicei parcursul' } },
      {
        type: 'list',
        ordered: true,
        items: [
          {
            ru: 'Покупатель оценивает бюджет: какую сумму он готов внести сразу и какой ежемесячный платёж для него комфортен.',
            ro: 'Cumpărătorul își evaluează bugetul: ce sumă poate achita din start și ce plată lunară îi este comodă.',
          },
          {
            ru: 'В банке узнают, на какую сумму кредита можно рассчитывать и подходит ли покупатель под условия Prima Casă.',
            ro: 'La bancă se află ce sumă de credit se poate obține și dacă cumpărătorul întrunește condițiile programului Prima Casă.',
          },
          {
            ru: 'Выбирают квартиру и обсуждают способ оплаты с отделом продаж.',
            ro: 'Se alege apartamentul și se discută modul de plată cu departamentul de vânzări.',
          },
          {
            ru: 'Собирают документы и подают заявку в банк.',
            ro: 'Se adună documentele și se depune cererea la bancă.',
          },
        ],
      },
      {
        type: 'image',
        image: {
          src: '/photos/hero-residential.jpg',
          alt: {
            ru: 'Фасад жилого дома с остеклёнными балконами на фоне вечернего неба',
            ro: 'Fațada unui bloc locativ cu balcoane vitrate pe fundalul cerului de seară',
          },
          caption: { ru: 'Иллюстрация, не объект Pamir Construct', ro: 'Ilustrație, nu este un obiect Pamir Construct' },
          kind: 'illustration',
          width: 2560,
          height: 1708,
        },
      },
      { type: 'heading', text: { ru: 'Документы и вопросы к банку', ro: 'Documentele și întrebările pentru bancă' } },
      {
        type: 'paragraph',
        text: {
          ru: 'Обычно банк просит удостоверение личности и подтверждение доходов — например, справку с места работы, а супружеские пары — ещё и свидетельство о браке. Документы по квартире и сделке готовит застройщик. Точный перечень зависит от банка, программы и вашей ситуации — уточняйте условия в банке. Перед подачей заявки полезно задать несколько вопросов:',
          ro: 'De obicei banca solicită buletinul de identitate și confirmarea veniturilor — de exemplu, certificatul de salariu, iar cuplurilor căsătorite — și certificatul de căsătorie. Documentele privind apartamentul și tranzacția le pregătește dezvoltatorul. Lista exactă depinde de bancă, de program și de situația dvs. — precizați condițiile la bancă. Înainte de a depune cererea, merită să puneți câteva întrebări:',
        },
      },
      {
        type: 'list',
        items: [
          { ru: 'Какой минимальный первый взнос?', ro: 'Care este avansul minim?' },
          { ru: 'Ставка фиксированная или плавающая и от чего она зависит?', ro: 'Dobânda este fixă sau variabilă și de ce depinde?' },
          { ru: 'Какие есть дополнительные расходы: страхование, оценка, комиссии?', ro: 'Ce cheltuieli suplimentare există: asigurare, evaluare, comisioane?' },
          { ru: 'Можно ли погасить кредит досрочно и на каких условиях?', ro: 'Se poate rambursa creditul anticipat și în ce condiții?' },
          { ru: 'Кредитует ли банк покупку квартиры в строящемся доме?', ro: 'Finanțează banca procurarea unui apartament într-un bloc în construcție?' },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Калькулятор на страницах проектов Botanic Star 2 (блоки 3 и 4) и Eco House показывает, как устроен расчёт стоимости квартиры и ежемесячного платежа в рассрочку. Цены в калькуляторе сейчас демонстрационные — актуальную стоимость и условия рассрочки сообщает менеджер. Отдел продаж Pamir Construct помогает с оформлением ипотеки, в том числе по программе Prima Casă, и со сбором документов.',
          ro: 'Calculatorul de pe paginile proiectelor Botanic Star 2 (blocurile 3 și 4) și Eco House arată cum funcționează calculul costului apartamentului și al plății lunare în rate. Prețurile din calculator sunt deocamdată demonstrative — costul actual și condițiile plății în rate le comunică managerul. Departamentul de vânzări Pamir Construct vă ajută cu perfectarea ipotecii, inclusiv prin programul Prima Casă, și cu colectarea documentelor.',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Это общая информация, а не финансовая консультация: условия кредита и решение по заявке принимает банк.',
          ro: 'Aceasta este o informație generală, nu o consultanță financiară: condițiile creditului și decizia privind cererea le stabilește banca.',
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
    subtitle: { ru: 'Поздравляем жителей с праздником.', ro: 'Îi felicităm pe locuitori cu ocazia sărbătorii.' },
    description: {
      ru: 'Город, в котором мы строим, — поздравление с праздником.',
      ro: 'Orașul în care construim — felicitări de sărbătoare.',
    },
    content: [
      {
        type: 'paragraph',
        text: {
          ru: '14 октября Кишинёв отмечает Храм города. Поздравляем всех жителей и гостей столицы с праздником!',
          ro: 'Pe 14 octombrie Chișinăul își sărbătorește hramul. Îi felicităm pe toți locuitorii și oaspeții capitalei cu ocazia sărbătorii!',
        },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Pamir Construct — строительная компания из Кишинёва. Мы создаём жилые комплексы полного цикла — от проектирования до сдачи дома — и строим так, чтобы жильё оставалось комфортным и через годы.',
          ro: 'Pamir Construct este o companie de construcții din Chișinău. Creăm complexe rezidențiale la cheie — de la proiectare până la darea în exploatare — și construim astfel încât locuința să rămână confortabilă și peste ani.',
        },
      },
      { type: 'heading', text: { ru: 'Город, в котором мы строим', ro: 'Orașul în care construim' } },
      {
        type: 'list',
        items: [
          {
            ru: 'Ботаника — Botanic Star, Botanic Park и квартал Botanic Star 2.',
            ro: 'Botanica — Botanic Star, Botanic Park și cvartalul Botanic Star 2.',
          },
          {
            ru: 'Телецентр — Eco House, жилой комплекс комфорт-класса.',
            ro: 'Telecentru — Eco House, complex rezidențial de clasă confort.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Ботаника — один из самых зелёных секторов Кишинёва, и именно здесь появилась линейка Botanic: имя первого комплекса, Botanic Star, со временем перешло к целой серии проектов.',
          ro: 'Botanica este unul dintre cele mai verzi sectoare ale Chișinăului, iar aici a apărut linia Botanic: numele primului complex, Botanic Star, a trecut cu timpul la o întreagă serie de proiecte.',
        },
      },
      {
        type: 'gallery',
        images: [
          IMG.botanicParkFacade,
          {
            src: `${P}/botanic-star/cover.jpg`,
            alt: {
              ru: 'Botanic Star: высокий дом с жёлто-белым фасадом и полукруглыми эркерами, вид снизу',
              ro: 'Botanic Star: bloc înalt cu fațadă galben-albă și bovindouri semicirculare, văzut de jos',
            },
            caption: { ru: 'Botanic Star — сданный комплекс, фото', ro: 'Botanic Star — complex finalizat, foto' },
            kind: 'photo',
            width: 1200,
            height: 1803,
          },
          {
            src: `${P}/botanic-park/gallery-2.jpg`,
            alt: {
              ru: 'Botanic Park: бело-жёлтый многоэтажный дом в окружении деревьев, у входа — парковка',
              ro: 'Botanic Park: bloc alb cu galben înconjurat de copaci, la intrare — parcarea',
            },
            caption: { ru: 'Botanic Park — фото', ro: 'Botanic Park — foto' },
            kind: 'photo',
            width: 1600,
            height: 1512,
          },
        ],
      },
      {
        type: 'quote',
        text: { ru: 'Строим пространство для жизни', ro: 'Construim spațiul pentru viață' },
        cite: { ru: 'Pamir Construct', ro: 'Pamir Construct' },
      },
      {
        type: 'paragraph',
        text: {
          ru: 'Желаем Кишинёву зелёных улиц и уютных дворов, а его жителям — тепла, благополучия и радости в собственном доме. С праздником, Кишинёв!',
          ro: 'Îi dorim Chișinăului străzi verzi și curți primitoare, iar locuitorilor săi — căldură, bunăstare și bucurie în propria casă. La mulți ani, Chișinău!',
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
