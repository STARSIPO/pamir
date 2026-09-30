# Интерактивный выбор квартиры — архитектура и спецификация

Путь покупателя: **Проект → Корпус → Этаж → Квартира → Планировка → Стоимость → Заявка.**
Функция встроена в существующий сайт (Next 16 App Router, статический экспорт на GitHub Pages,
RU/RO, три темы, живая — Premium Dark). Визуальные правила — `docs/DESIGN-SYSTEM.md`.

---

## 1. Данные

```
src/lib/inventory/types.ts        доменная модель (ProjectInventory → Building → FloorPlate/Floor → Apartment)
src/lib/inventory/repository.ts   ЕДИНСТВЕННАЯ точка чтения данных (getInventory, stats, *Params…)
src/lib/inventory/plan-generator.ts  параметрические 2D-планы квартир из слота этажа
src/content/inventory/*.ts        данные проектов (сейчас — DEMO для botanic-star-2-blocks-3-4)
```

- Квартиры хранятся **плоским списком** (как таблица CRM/CMS): `id, number, projectSlug, buildingId,
  floor, slot, rooms, type, area, balconyArea, outdoor, bathrooms, pricePerSqm, totalPrice, status,
  plan2D, model3D, features`. Этажи и статистика вычисляются (`repository.stats`).
- **Подключение backend/CMS/CRM:** сохранить сигнатуры функций `repository.ts` и заменить их тела
  (fetch на этапе сборки для статического сайта; async + fetch на Node-хостинге). Компоненты не
  импортируют `src/content/inventory` напрямую.
- **Демо-данные:** `inventory.demo = true` → на каждой странице подбора видна плашка «Демо-данные»,
  страницы помечены `noindex`. Реальные данные: заменить модуль и поставить `demo: false`.
- Геометрия в метрах: площадка (`site`), пятна корпусов (`footprint`), типовые этажи (`plates` со
  `slots`), планы квартир (`plan2D.rooms[].polygon`). Эти же числа будут экструдироваться в 3D.

## 2. Цены — `src/config/pricing.json`

Владелец меняет цены без кода: базовая цена м² по проекту, коэффициенты корпуса / этажа (диапазоны) /
комнатности / типа квартиры, доля цены м² для балкона/террасы, цены парковки, параметры рассрочки
(сроки, мин/макс/по умолчанию взнос, годовая ставка; 0 = беспроцентная рассрочка застройщика).
Движок: `src/lib/pricing/engine.ts` (`pricePerSqm`, `estimate`, `installment`, `formatEUR`,
`formatArea`). Демо-квартиры посчитаны этим же движком — калькулятор и карточки не расходятся.
`pricing.demo = true` → рядом с ценами пометка «цены ориентировочные / демо».

## 3. Маршруты (статически генерируются)

| Шаг | URL | Файл |
|---|---|---|
| Выбор корпуса | `/{locale}/projects/{slug}/select` | `src/app/[locale]/projects/[slug]/select/page.tsx` |
| Выбор этажа | `…/select/{building}` | `…/select/[building]/page.tsx` |
| План этажа | `…/select/{building}/{floor}` | `…/select/[building]/[floor]/page.tsx` |
| Квартира | `/{locale}/projects/{slug}/apartments/{id}` | `…/apartments/[apartment]/page.tsx` |

Хелперы: `routes.selector / building / floor / apartment` в `src/i18n/routing.ts`. RO использует
`/ro/proiecte/…` (middleware переписывает первый сегмент; подсегменты языконезависимы). Каждая
страница: `generateStaticParams` из `repository` (× locales), `dynamicParams = false`, `robots:
noindex` при demo. Состояние выбора живёт в URL — «назад», ссылки и аналитика работают сами.

## 4. Вьюеры 2D сейчас, 3D потом — `src/components/inventory/viewer/types.ts`

Каждый шаг рендерится через интерфейс пропсов: `ComplexViewProps` (корпуса), `BuildingViewProps`
(этажи), `FloorViewProps` (квартиры), `ApartmentViewProps` (комнаты). 2D-компоненты реализуют их
сейчас; сцена Three.js / React Three Fiber позже реализует **те же пропсы** и подключается через
`ViewerMode = '2d' | '3d'` (переключатель «2D | 3D» на странице квартиры уже есть, 3D — «скоро»).
Выбор всегда по id (корпус, номер этажа, id квартиры); `model3D.nodeId` в данных связывает узлы
GLTF с этими id. План подключения 3D:

1. `npm i three @react-three/fiber @react-three/drei`; компоненты в `src/components/inventory/viewer/3d/`,
   загружать через `next/dynamic({ ssr: false })` только при выборе режима 3D.
2. `ComplexScene3D` (вращение, выбор корпуса, подсветка этажей), `ApartmentScene3D` (вращение
   квартиры, комнаты, материалы, день/вечер) — те же пропсы, что у 2D.
3. Заполнить `model3D` у проекта/корпусов/квартир (glb + nodeId). Виртуальный тур — отдельный
   режим того же вьюера.

## 5. Подбор (Smart Recommendation) — `src/lib/recommend/`

Контракт `RecommendationProvider.recommend(criteria, pool, limit): Promise<Recommendation[]>`.
Сейчас — локальный скоринг (бюджет, комнаты, площадь, этаж, выгодность цены м²). AI/ML API
подключается новым провайдером с тем же интерфейсом (`src/lib/recommend/index.ts`).

## 6. Заявки, аналитика

- `LeadSection`/`LeadForm` принимают `apartment` (контекст «Квартира №34, Блок 3, этаж 7»): поле
  уходит в заявку (`/api/lead` → Telegram/CRM; на статическом экспорте — переход на «Спасибо»).
- `src/lib/analytics.ts` → `track(event, props)`; сейчас dataLayer/console. События: selector_view,
  building_select, floor_select, apartment_open, apartment_view_mode, plan_download,
  calculator_change, installment_change, recommend_submit, lead_open, lead_submit.

## 7. Строки

`src/i18n/dictionaries/inventory/{common,selector,floors,apartment,calculator,recommend}.{ru,ro}.ts`,
доступ `dict.inventory.<area>.<key>`. RU задаёт форму, RO типизирован `typeof xxxRu`.

## 8. Визуальный язык подбора

Премиальный архитектурный, не «дашборд»: крупная светлая типографика, hairlines, много воздуха,
токены темы (никаких hex), квадратные углы.

- **Статусы на схемах:** доступна — заливка `accent/15`, контур `accent`, hover `accent/35`;
  бронь — штриховка (SVG pattern) `ink/25` на `ink/5`; продана — `ink/5`, контур `line/15`,
  не кликабельна. Легенда рядом с каждой схемой.
- SVG в метрах (`viewBox`), линии `vector-effect: non-scaling-stroke`, подписи `.label`.
- Движение: схемы «прорисовываются» при появлении (stroke-dashoffset / fade 600–900 ms,
  `ease-premium`), корпуса поднимаются из основания; hover — 200–300 ms. `prefers-reduced-motion`
  — без анимаций. Никаких ярких/игровых эффектов.
- Каждая схема имеет доступную альтернативу — список (корпуса / этажи / квартиры) с теми же
  данными, клавиатура (Tab/Enter), `aria-label` с числами.
- Touch: первый тап выбирает и показывает карточку с кнопкой действия; действие — второй тап
  по кнопке. Hover-карточки только на устройствах с hover.
- Цена — крупно (`text-display-md/lg`, `tabular`), «от €X» в списках.
