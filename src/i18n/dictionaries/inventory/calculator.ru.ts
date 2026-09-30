/** Inventory · calculator strings (RU). Shape is the source of truth for RO. */
export const calculatorRu = {
  eyebrow: 'Калькулятор',
  title: 'Рассчитайте стоимость вашей квартиры',
  subtitle:
    'Меняйте параметры — стоимость пересчитывается сразу, по тем же ценам, что и в карточках квартир.',
  modesLabel: 'Режим расчёта',
  modes: { price: 'Стоимость', installment: 'Рассрочка' },

  /** Apartment context. {n} — apartment number. */
  context: 'По квартире №{n}',
  contextChanged: 'Параметры изменены',
  contextReset: 'Вернуть квартиру №{n}',

  fields: {
    project: 'Проект',
    building: 'Корпус',
    rooms: 'Комнаты',
    area: 'Площадь',
    floor: 'Этаж',
    type: 'Тип квартиры',
    outdoor: 'Балкон или терраса',
    outdoorArea: { balcony: 'Площадь балкона', terrace: 'Площадь террасы' },
    parking: 'Парковка',
  },
  /** "7 из 10". {n} — top floor. */
  floorOf: 'из {n}',
  parking: { none: 'Без парковки', surface: 'Наземная', underground: 'Подземная' },
  /** Accessible names for the numeric inputs next to sliders. */
  inputs: {
    area: 'Площадь квартиры, м²',
    floor: 'Этаж',
    outdoorArea: 'Площадь балкона или террасы, м²',
    price: 'Стоимость квартиры, €',
    downPercent: 'Первый взнос, %',
    downAmount: 'Первый взнос, €',
  },

  result: {
    title: 'Ваш расчёт',
    area: 'Площадь',
    pricePerSqm: 'Цена за м²',
    /** Sub-label of the balcony / terrace line (its value is the € it adds). {p} — share of the m² price, percent. */
    outdoorShare: '{p}% цены м²',
    apartmentPrice: 'Стоимость квартиры',
    parking: 'Парковочное место',
    total: 'Итого',
    /** {m} — monthly payment; {d} — down payment %; {t} — term in months. */
    installmentTeaser: 'В рассрочку — ≈ {m} / мес',
    installmentTeaserHint: 'взнос {d}% · {t} мес.',
    toInstallment: 'Рассчитать рассрочку',
    lead: 'Оставить заявку',
  },

  installment: {
    price: 'Стоимость',
    fromEstimate: 'Из расчёта стоимости',
    /** {v} — the estimate total. */
    resetPrice: 'Вернуть {v}',
    downPayment: 'Первый взнос',
    downModeLabel: 'Взнос в процентах или в евро',
    downModes: { percent: '%', amount: '€' },
    term: 'Срок',
    months: 'мес.',
    back: 'Изменить параметры квартиры',
  },

  installmentResult: {
    title: 'Рассрочка',
    down: 'Первый взнос',
    remainder: 'Остаток',
    term: 'Срок',
    monthly: 'Ежемесячный платёж',
    perMonth: '/ мес',
    totalPaid: 'Всего выплат',
    overpay: 'Переплата',
    interestFree: 'Без процентов — рассрочка от застройщика',
    /** {r} — annual rate, percent. */
    rate: 'Ставка {r}% годовых',
  },
  installmentNote: 'Расчёт ориентировочный, финальные условия уточняйте у менеджера.',

  /**
   * The line handed to the lead form with «Оставить заявку» (see
   * src/lib/pricing/lead-calculation.ts): what the manager receives.
   */
  lead: {
    /** Caption for the line in the lead form. */
    caption: 'Расчёт из калькулятора',
    /** {v} — the configuration ("Блок 3 · 2 комн. · 63,7 м² · этаж 7"); {t} — total. */
    price: 'Расчёт: {v} — итого {t}',
    /** Appended after "; " in the installment mode. {n} — months, {d} — down payment %, {a} — in €, {m} — monthly. */
    installment: 'рассрочка {n} мес.: взнос {d}% ({a}), ≈ {m} / мес',
    /** Replaces `price` when the installment price was typed by hand. {p} — that price. */
    manualPrice: 'Расчёт: стоимость {p}',
    parking: { surface: 'наземный паркинг', underground: 'подземный паркинг' },
  },

  sticky: { total: 'Итого', monthly: 'В месяц', details: 'Подробнее' },
  /** Screen-reader announcements after a change settles. {v} — value. */
  announce: { total: 'Итого {v}', monthly: 'Ежемесячный платёж {v}' },
};
