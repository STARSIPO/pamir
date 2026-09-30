/**
 * Inventory · floors strings (RU): step 2 (building elevation → floor) and
 * step 3 (floor plan → apartment). Shape is the source of truth for RO.
 * `{name}` placeholders are filled by FloorFormat.fill().
 */
export const floorsRu = {
  title: 'Выбор этажа',

  // ── Step 2 · building → floor ────────────────────────────────────────
  /** <title>: "Блок 3 — выбор этажа". */
  metaBuilding: '{building} — выбор этажа',
  /** {floors} = "10 этажей" (count + floorsForms). */
  metaBuildingDescription: '{project}: {building}, {floors}. Свободные квартиры по этажам и цены.',
  /** H1. */
  buildingTitle: '{building} — выберите этаж',
  buildingLead: 'Выберите этаж на фасаде или в списке — откроется его план со свободными квартирами и ценами.',
  statFloors: 'Этажность',
  statAvailable: 'Свободно',
  statFrom: 'Цена от',
  /** Caption above the elevation. */
  facadeLong: 'Фасад',
  facadeEnd: 'Торцевой фасад',
  facadeAria: '{building}: фасад, выберите этаж',
  /** Quiet label under the non-residential ground floor. */
  groundFloor: '1 этаж — нежилые помещения',
  listTitle: 'Этажи',
  listHead: { floor: 'Этаж', available: 'Свободно', price: 'Цена' },
  /** "4 из 8". */
  availableOf: '{available} из {total}',
  /** Side tag on the elevation: "Доступно: 4 квартиры". */
  availableTag: 'Доступно: {count}',
  noneAvailable: 'Свободных квартир нет',
  /** Plural forms (Intl.PluralRules categories). */
  apartmentsForms: { one: 'квартира', few: 'квартиры', many: 'квартир', other: 'квартиры' },
  floorsForms: { one: 'этаж', few: 'этажа', many: 'этажей', other: 'этажа' },
  openFloor: 'Открыть план этажа',
  /** aria-label of a floor band / list row. */
  floorAria: 'Этаж {floor}: свободно {available} из {total}{price}',
  priceFromAria: ', цена от {price}',
  close: 'Закрыть',

  // ── Step 3 · floor → apartment ───────────────────────────────────────
  metaFloor: '{building}, этаж {floor} — план',
  metaFloorDescription: '{project}: {building}, этаж {floor}. План этажа, свободные квартиры, площади и цены.',
  /** H1: "Блок 3, этаж 7". */
  floorTitle: '{building}, этаж {floor}',
  floorLead: 'Свободные квартиры выделены на плане. Выберите квартиру на плане или в списке — откроется её карточка с планировкой и ценой.',
  switcher: 'Другие этажи',
  prevFloor: 'Этаж ниже',
  nextFloor: 'Этаж выше',
  planCaption: 'План этажа',
  planAria: '{building}, этаж {floor}: план этажа, выберите квартиру',
  corridor: 'Коридор',
  core: 'Лестница и лифт',
  /** Compass letter. */
  north: 'С',
  courtyard: 'Двор',
  street: 'Улица',
  metre: 'м',
  planNote: 'Схема носит информационный характер: площади и расположение уточняются по проекту.',
  price: 'Цена',
  details: 'Подробнее',
  apartmentsTitle: 'Квартиры на этаже',
  listHeadApartment: { number: '№', specs: 'Комнаты · площадь', price: 'Цена' },
  /** aria-label of an apartment zone / row. */
  apartmentAria: 'Квартира №{number}: {rooms}, {area} м², {status}',
  apartmentPriceAria: ', цена от {price}',
  statusOnly: 'Квартира №{number}: {status}',
};
