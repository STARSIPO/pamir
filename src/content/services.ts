import type { Service } from './types';

/**
 * Services. NOTE: the old site mistakenly referenced another company
 * ("Construct Invest Garant Grup"). Every entry here uses Pamir Construct only.
 * The final list must be confirmed by the owner (see PLACEHOLDERS.md).
 */
export const services: Service[] = [
  {
    slug: 'residential-construction',
    icon: 'building',
    title: { ru: 'Строительство жилых комплексов', ro: 'Construcția complexelor rezidențiale' },
    summary: {
      ru: 'Полный цикл возведения жилых комплексов — от котлована до сдачи дома в эксплуатацию.',
      ro: 'Ciclu complet de construcție a complexelor rezidențiale — de la fundație până la darea în exploatare.',
    },
    points: [
      { ru: 'Монолитно-каркасное и кирпичное строительство', ro: 'Construcție monolit-cadru și din cărămidă' },
      { ru: 'Контроль качества на каждом этапе', ro: 'Control al calității la fiecare etapă' },
      { ru: 'Соблюдение сроков строительства', ro: 'Respectarea termenelor de construcție' },
    ],
  },
  {
    slug: 'general-contracting',
    icon: 'hard-hat',
    title: { ru: 'Генеральный подряд', ro: 'Antrepriză generală' },
    summary: {
      ru: 'Управление проектом и подрядчиками, единая ответственность за результат и сроки.',
      ro: 'Gestionarea proiectului și a subantreprenorilor, responsabilitate unică pentru rezultat și termene.',
    },
    points: [
      { ru: 'Координация всех участников стройки', ro: 'Coordonarea tuturor participanților la construcție' },
      { ru: 'Прозрачное планирование и отчётность', ro: 'Planificare și raportare transparentă' },
    ],
  },
  {
    slug: 'construction-works',
    icon: 'wrench',
    title: { ru: 'Строительно-монтажные работы', ro: 'Lucrări de construcții-montaj' },
    summary: {
      ru: 'Общестроительные, монтажные и инженерные работы силами собственной команды.',
      ro: 'Lucrări generale de construcție, montaj și inginerie realizate de echipa proprie.',
    },
    points: [
      { ru: 'Инженерные системы и коммуникации', ro: 'Sisteme inginerești și comunicații' },
      { ru: 'Фасадные и отделочные работы', ro: 'Lucrări de fațadă și finisaj' },
    ],
  },
  {
    slug: 'design',
    icon: 'ruler',
    title: { ru: 'Проектирование', ro: 'Proiectare' },
    summary: {
      ru: 'Архитектурное и инженерное проектирование жилых объектов.',
      ro: 'Proiectare arhitecturală și inginerească a obiectelor rezidențiale.',
    },
    points: [
      { ru: 'Продуманные планировки квартир', ro: 'Planuri de apartamente bine gândite' },
      { ru: 'Инженерные разделы проекта', ro: 'Secțiuni inginerești ale proiectului' },
    ],
  },
  {
    slug: 'landscaping',
    icon: 'trees',
    title: { ru: 'Благоустройство территории', ro: 'Amenajarea teritoriului' },
    summary: {
      ru: 'Закрытые дворы, озеленение, детские площадки и удобные пешеходные зоны.',
      ro: 'Curți închise, spații verzi, locuri de joacă și zone pietonale comode.',
    },
    points: [
      { ru: 'Озеленение и малые архитектурные формы', ro: 'Spații verzi și forme arhitecturale mici' },
      { ru: 'Детские и рекреационные зоны', ro: 'Zone pentru copii și recreere' },
    ],
  },
  {
    slug: 'mortgage-support',
    icon: 'wallet',
    title: { ru: 'Помощь с ипотекой и Prima Casă', ro: 'Asistență ipotecă și Prima Casă' },
    summary: {
      ru: 'Сопровождение при оформлении ипотеки и участии в государственной программе Prima Casă.',
      ro: 'Asistență la perfectarea ipotecii și participarea în programul de stat Prima Casă.',
    },
    points: [
      { ru: 'Подбор банковской программы', ro: 'Selectarea programului bancar' },
      { ru: 'Помощь со сбором документов', ro: 'Asistență la colectarea documentelor' },
    ],
  },
  {
    slug: 'purchase-consulting',
    icon: 'handshake',
    title: { ru: 'Консультации по покупке квартиры', ro: 'Consultanță la achiziția apartamentului' },
    summary: {
      ru: 'Помощь в выборе квартиры, планировки и способа оплаты под ваши задачи.',
      ro: 'Asistență în alegerea apartamentului, a planului și a modului de plată potrivit nevoilor dvs.',
    },
    points: [
      { ru: 'Подбор по бюджету и параметрам', ro: 'Selecție după buget și parametri' },
      { ru: 'Индивидуальные условия оплаты', ro: 'Condiții de plată individuale' },
    ],
  },
  {
    slug: 'legal-support',
    icon: 'scale',
    title: { ru: 'Юридическое сопровождение', ro: 'Asistență juridică' },
    summary: {
      ru: 'Оформление сделки и документов на квартиру под ключ.',
      ro: 'Perfectarea tranzacției și a documentelor pentru apartament la cheie.',
    },
    points: [
      { ru: 'Проверка и подготовка документов', ro: 'Verificarea și pregătirea documentelor' },
      { ru: 'Сопровождение до получения ключей', ro: 'Asistență până la primirea cheilor' },
    ],
  },
];
