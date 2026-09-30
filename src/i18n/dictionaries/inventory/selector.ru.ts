/** Inventory · selector strings (RU). Shape is the source of truth for RO. */
export const selectorRu = {
  // Step 1 page — /projects/{slug}/select
  metaDescription:
    'Интерактивная схема комплекса: выберите корпус, этаж и квартиру, посмотрите планировку, цену и статус квартиры.',
  title: 'Выберите корпус',
  lead: 'Нажмите на корпус на схеме комплекса — покажем этажность, свободные квартиры и цены. Дальше — этаж, планировка и расчёт стоимости.',

  // Scheme
  schemeLabel: 'Схема комплекса',
  hintPointer: 'Наведите на корпус, чтобы увидеть детали. Нажмите, чтобы перейти к этажам.',
  hintTouch: 'Нажмите на корпус, чтобы увидеть детали, и ещё раз — чтобы перейти к этажам.',
  north: 'С',
  legendTitle: 'Условные обозначения',
  features: {
    courtyard: 'Двор',
    playground: 'Детская площадка',
    green: 'Озеленение',
    parking: 'Парковка',
    road: 'Улица',
    entrance: 'Въезд',
  },

  // Info panel and building cards
  complex: 'Комплекс',
  summaryHint: 'Выберите корпус на схеме или в списке ниже — здесь появятся этажность, свободные квартиры и цены.',
  buildingsCount: 'Корпусов',
  availableLabel: 'Свободные квартиры',
  of: 'из',
  roomsLabel: 'Комнатность',
  priceLabel: 'Стоимость',
  chooseFloor: 'Выбрать этаж',
  soldOut: 'Свободных квартир нет',
  selected: 'Выбран',
  listTitle: 'Корпуса комплекса',
  recommendCta: 'Подобрать по параметрам',

  // Touch, below lg: bar that slides up after the first tap on a building
  bar: {
    label: 'Выбранный корпус',
    floors: { one: 'этаж', few: 'этажа', many: 'этажей', other: 'этажа' },
    available: 'Свободно {available} из {total}',
    close: 'Закрыть',
  },

  // Project-page teaser block
  teaser: {
    title: 'Выберите квартиру на интерактивной схеме',
    text: 'Корпус, этаж, планировка и цена — в несколько шагов. Свободные, забронированные и проданные квартиры видны сразу.',
    available: 'Квартир в продаже',
    buildings: 'Корпусов',
    rooms: 'Комнатность',
    price: 'Стоимость',
  },
};
