/**
 * Inventory · apartment page strings (RU). Shape is the source of truth for RO.
 * `{name}` placeholders are filled by `fill()` (src/components/inventory/apartment/text.ts).
 */
export const apartmentRu = {
  /** H1 and breadcrumbs: «Квартира №34». */
  title: 'Квартира №{n}',
  crumb: 'Квартира {n}',
  crumbFloor: 'Этаж {n}',
  /** Browser title: «Квартира №34 — Botanic Star 2 — блоки 3 и 4». */
  metaTitle: 'Квартира №{n} — {project}',
  metaDescription: '{rooms}, {area} м², этаж {floor}, {building}. Планировка, стоимость и заявка онлайн.',
  eyebrow: '{building} · Этаж {floor}',
  /** Line under the title: «Трёхкомнатная квартира площадью 84,6 м² на 7-м этаже из 10. Балкон 4,8 м².» */
  summary: {
    kind: {
      1: 'Однокомнатная квартира',
      2: 'Двухкомнатная квартира',
      3: 'Трёхкомнатная квартира',
      4: 'Четырёхкомнатная квартира',
    } as Record<number, string>,
    penthouse: 'Пентхаус',
    body: '{kind} площадью {area} м² на {floor}-м этаже из {floors}.',
    balcony: 'Балкон {area} м².',
    terrace: 'Терраса {area} м².',
  },
  /** Context line sent with the lead: «Квартира №34, Блок 3, этаж 7». */
  leadContext: 'Квартира №{n}, {building}, этаж {floor}',

  /** The lead section at the foot of an available or reserved apartment's page. */
  leadSection: {
    title: 'Заявка на квартиру №{n}',
    lead: 'Менеджер подтвердит, что квартира свободна, ответит на вопросы и расскажет об условиях покупки и рассрочки.',
    leadReserved:
      'Квартира сейчас забронирована. Оставьте заявку — сообщим, если бронь будет снята, и предложим похожие варианты.',
    /** The form's button for an available apartment (reserved: `actions.reservedLead`, the CTA's own words). */
    submit: 'Отправить заявку',
    /** Beside the form on wide screens, under the sales number: what follows the request. */
    nextTitle: 'Что дальше',
    next: [
      { title: 'Связь с менеджером', text: 'Свяжемся удобным для вас способом — по телефону, в WhatsApp или Telegram.' },
      { title: 'Просмотр', text: 'Согласуем удобное время, чтобы вы увидели квартиру или объект вживую.' },
      {
        title: 'Условия покупки',
        text: 'Рассчитаем рассрочку, поможем с ипотекой, в том числе по программе Prima Casă, и подготовим документы.',
      },
    ] as { title: string; text: string }[],
    nextReserved: [
      { title: 'Связь с менеджером', text: 'Свяжемся удобным для вас способом — по телефону, в WhatsApp или Telegram.' },
      { title: 'Похожие квартиры', text: 'Подберём свободные квартиры с близкой планировкой, площадью и ценой.' },
      { title: 'Если бронь снимут', text: 'Сообщим, как только квартира снова станет доступной.' },
    ] as { title: string; text: string }[],
  },

  pager: {
    label: 'Квартиры этажа',
    /** Accessible names of the steps; {status} is the neighbour's, lower case. */
    prev: 'Предыдущая квартира на этаже: №{n}, {status}',
    next: 'Следующая квартира на этаже: №{n}, {status}',
    /** The apartment's place among the floor's: «3 из 8 на этаже». */
    position: '{i} из {total} на этаже',
    backToFloor: 'Вернуться к плану этажа',
    backToFloorShort: 'План этажа',
  },

  viewer: {
    title: 'Планировка',
    modeLabel: 'Режим просмотра',
    mode2d: '2D',
    mode3d: '3D',
    soon: 'скоро',
    soonTitle: '3D-модель квартиры — скоро',
    soonText:
      'Объёмная модель квартиры с отделкой, режимами «день» и «вечер» и виртуальным туром появится в следующем обновлении. Пока — точный 2D-план.',
    back2d: 'Смотреть 2D-план',
    planAria: 'План квартиры №{n}: {rooms}, {area} м². Помещения можно выделить.',
    room: '{name} — {area} м²',
    entrance: 'Вход',
    facade: 'Фасад',
    north: 'С',
    northAria: 'Направление на север',
    metre: 'м',
    scaleAria: 'Масштабная линейка: {n} м',
    hintHover: 'Наведите на помещение, чтобы выделить его',
    hintTouch: 'Коснитесь помещения, чтобы выделить его',
    explication: 'Экспликация помещений',
    indoorTotal: 'Общая площадь',
  },

  facts: {
    title: 'Характеристики квартиры',
    rooms: 'Комнаты',
    area: 'Площадь',
    floor: 'Этаж',
    floorOf: 'из {n}',
    building: 'Корпус',
    bathrooms: 'Санузлы',
    type: 'Тип',
    pricePerSqm: 'Цена за м²',
    /** Why the total exceeds area × price per m²: «Включая балкон 6,1 м² по 50% от цены м²». */
    outdoorIncluded: {
      balcony: 'Включая балкон {area} по {share}% от цены м²',
      terrace: 'Включая террасу {area} по {share}% от цены м²',
    },
    total: 'Стоимость квартиры',
    features: 'Особенности',
  },

  actions: {
    lead: 'Оставить заявку',
    leadHint: 'Менеджер ответит на вопросы и расскажет об условиях покупки',
    reservedLead: 'Узнать о снятии брони',
    /** The phone price bar has room for a short action only (reserved). */
    reservedLeadShort: 'Узнать о брони',
    calculate: 'Рассчитать стоимость',
    calculateHint: 'Паркинг, рассрочка',
    download: 'Скачать планировку',
    downloadHint: 'SVG · для печати',
    downloadHintTouch: 'Откроется для печати',
  },

  status: {
    reserved:
      'Квартира забронирована. Оставьте заявку — сообщим, если бронь будет снята, и предложим похожие варианты.',
    sold: 'Эта квартира продана. Ниже — похожие квартиры, которые ещё доступны.',
  },

  similar: {
    title: 'Похожие доступные квартиры',
    number: '№{n}',
    item: '{rooms} · {area} м² · этаж {floor}',
    onFloor: 'Все квартиры этажа {n}',
    inBuilding: 'Выбрать этаж — {building}',
    none: 'Похожих свободных квартир сейчас нет — выберите другой этаж или оставьте заявку.',
  },

  /** Text inside the downloaded standalone SVG. */
  file: {
    name: 'planirovka',
    generated: 'Сформировано {date}',
    note: 'План схематичный. Размеры и площади уточняйте в отделе продаж.',
    /** Buttons of the print-ready page a phone opens instead of the bare file. */
    print: 'Печать или PDF',
    save: 'Скачать SVG',
  },
};
