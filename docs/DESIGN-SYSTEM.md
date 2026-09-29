# Pamir Construct — дизайн-система (редизайн 2026-09)

Направление: **BIG TYPOGRAPHY + ARCHITECTURE + WHITESPACE.** Сайт крупного
современного девелопера. Фокус — архитектура и проекты. Референсы (solomon.md,
inamstro.md) — только направление, не копируем.

Контент, тексты и структура — прежние (`src/content/*`, `src/i18n/dictionaries/*`).
Меняется визуальный язык: композиция, размеры, отступы, типографика, карточки,
hero, иерархия.

---

## 1. Темы

Три полные палитры. Переключение — **одна строка** в `src/config/theme.ts`:

```ts
export const SITE_THEME: ThemeName = 'warm'; // 'warm' | 'dark' | 'stone'
```

Значение уходит в `<html data-theme="…">`. Все цвета — CSS-переменные в
`src/app/globals.css`. Для просмотра без пересборки: `?theme=dark` в URL
(держится на сессию, `?theme=reset` — сброс).

| Роль (Tailwind) | Warm (V1) | Dark (V2) | Stone (V3) |
|---|---|---|---|
| `bg-canvas` основной фон | #F2EFE9 | #111210 | #E9E9E5 |
| `bg-canvas-alt` доп. фон | #E5E0D7 | #1B1C19 | #D5D6D0 |
| `bg-surface` плоскости, поля | #FFFFFF | #1B1C19 | #F8F8F5 |
| `text-ink` основной текст | #171717 | #F4F1EA | #161816 |
| `text-muted` вторичный | #6A6863 | #AAA79F | #696D68 |
| `accent` | #9A8264 | #B39A73 | #59665B |
| `accent-soft` | #C9BBA6 | #70614D | #9CA59C |
| `accent-strong` (hover) | #7F6A50 | #C8B28E | #46514A |
| `text-on-accent` | #FFFFFF | #111210 | #F8F8F5 |
| `bg-band` / `text-band-fg` / `text-band-muted` контрастная полоса (CTA, footer) | #171717 / #F2EFE9 / #A09C94 | #1B1C19 / #F4F1EA / #AAA79F | #161816 / #E9E9E5 / #9A9E98 |
| `line` (только с альфой: `border-line/15`) | ink | ink | ink |
| `scrim` (затемнение фото, всегда почти чёрный) | #0E0E0C | #0A0A09 | #0C0E0C |

**Правила**
- В компонентах **нет hex-цветов** и нет `bg-white`/`text-black` для фона/текста страницы.
  Исключение: текст поверх фотографии — `text-white`, `text-white/70` (фото всегда под `scrim`).
- Акцент — редко: активные состояния, тонкие линии, маленькие квадраты статуса, hover.
  Мелкий текст акцентом не набираем (в Warm контраст 3.2:1). Основная кнопка — `bg-ink`.
- Hairlines: `border-line/15` (на canvas), `border-band-fg/15` (на band), `border-white/20` (на фото).
- Старые имена (`brand`, `graphite`, `sand`, `stone`) — только алиасы для `/preview`. В новом коде не использовать.

## 2. Типографика

- Display: **Inter Tight** (`font-display`), вес **300 (font-light)** для крупных заголовков, 400 — для подписей среднего размера.
- Текст: **Inter** (`font-sans`), 400/500.
- Только эти размеры (Tailwind):

| Класс | Размер | Где |
|---|---|---|
| `text-hero` | clamp(3rem, 8.6vw, 9.5rem) | только слоган на главной |
| `text-display-xl` | clamp(2.5rem, 6vw, 6.25rem) | заголовки секций, H1 внутренних страниц |
| `text-display-lg` | clamp(2.125rem, 4.2vw, 4.5rem) | название проекта в крупных блоках, цитаты, CTA |
| `text-display-md` | clamp(1.625rem, 2.6vw, 2.75rem) | названия в карточках, крупные цифры/телефоны, statement-текст |
| `text-display-sm` | clamp(1.25rem, 1.7vw, 1.625rem) | подзаголовки пунктов (преимущества, шаги, FAQ) |
| `text-lead` | clamp(1.0625rem, 1.3vw, 1.3125rem) | лид-абзацы |
| `text-base` / `md:text-[1.0625rem]` | 16–17px | обычный текст, `leading-relaxed` |
| `.label` / `text-label` | 0.72rem, uppercase, tracking 0.16em | метки, индексы секций, мета, подписи |

- Заголовки: `font-display font-light text-balance`. Никаких `font-bold`/`font-semibold` в display.
- Заголовок пословно появляется: `<Reveal stagger>` + `splitWords(title)` (см. `SectionHeading`).
- Цифры: `tabular`.

## 3. Сетка, отступы, геометрия

- `.container` — max 1680px, поля `clamp(1.25rem, 4vw, 4.5rem)` (≥20px на мобильном).
- Сетка: `grid-cols-12` на `lg`, `gap-gutter` (clamp 1–2.25rem). Колонки асимметричны: 7/5, 8/4, 5/7, offset `col-start-*`.
- Вертикальный ритм: секции `py-section` (clamp 5.5–11rem), плотные — `py-section-sm`. Воздуха много.
- **Скругления — 0** (глобально), тени — нет. Геометрия архитектурная: линии 1px, прямоугольники.
- Иконки lucide — только если без них хуже, `strokeWidth={1.25}`, `h-5 w-5`, цвет `text-muted`/`text-accent`.

## 4. Компоненты-фундамент (не менять API без согласования)

| Компонент | Назначение |
|---|---|
| `ui/Section` | `tone`: `canvas` · `alt` · `surface` · `band`; `spacing`: `default` · `sm` · `none`; `bleed` |
| `ui/SectionHeading` | `index="02"`, `eyebrow`, `title`, `subtitle`, `action`, `tone="light"` (для band), `size` xl/lg/md |
| `ui/Reveal` | `variant="fade"` (по умолчанию, fade-up), `variant="mask"` (раскрытие фото снизу + доводка зума), `stagger` (пословно), `delay` (сек., шаг 0.08) |
| `ui/Media` | фото: `aspect`, `fill`, `zoom` (медленный hover-zoom, нужен `group` у ссылки), `caption` («Визуализация»), `position`, `treat` (градинг темы, по умолчанию on), `priority`, `sizes` |
| `ui/Button` | `primary` · `outline` · `ghost` (текст+стрелка+линия) · `inverse` (на band) · `light` / `outlineLight` (на фото); `arrow`; `size` md/lg |
| `ui/Button → ArrowLabel` | «Смотреть проект →» внутри карточки-ссылки (span, реагирует на `group-hover`) |
| `ui/Button → Arrow` | тонкая стрелка |
| `ui/StatusBadge` | квадрат + метка статуса (`currentColor`) |
| `projects/ProjectCard` | большая карточка проекта: фото + статус·район + крупное имя + «Смотреть проект →». `aspect`, `size` md/lg, `sizes` |
| `shared/PageHero` | открытие внутренних страниц (label + линия, H1 display-xl light, лид справа) |
| `shared/CtaBand` | финальный CTA внутренних страниц на `band` |
| `brand/Logo` | монохромный, `currentColor` |
| `layout/SmoothScroll` | Lenis; оверлеи блокируют скролл через `lockScroll(true/false)` из `@/lib/smooth-scroll` и ставят `data-lenis-prevent` на прокручиваемые контейнеры |

## 5. Фото

- Реальные рендеры и фото Pamir: `public/photos/projects/<slug>/…` (см. `docs/IMAGE-CREDITS.md`).
  В контенте: `project.cover`, `project.hero` (широкое, для full-bleed), `project.gallery`, `project.coverKind`.
- Рендер **всегда** подписан `caption={dict.design.render}` («Визуализация»), если `coverKind === 'render'`.
- Все изображения через `<Media>` (или `next/image` с `asset()` + класс `img-treat`). CSS `background-image: url()` — нельзя (ломается basePath на GitHub Pages).
- Стоковые фото `public/photos/*.jpg` — только атмосфера, никогда не под подписью проекта.
- Hero-кадр (LCP): `priority`, без mask-reveal; вход — `animate-hero-zoom` (scale 1.08→1).
- Фото над текстом — всегда `scrim`-градиент (`from-scrim/80`), текст `text-white`.

## 6. Движение

- Кривые: `ease-premium` (прибытие), `ease-arch` (симметричные движения). Длительности 300–700ms для UI, 900–1600ms для фото.
- Разрешено: fade-up, mask reveal, пословное появление заголовков, hover-zoom фото 3–4% за 1.4s, рисование hairline (`rule-draw`), переход шапки.
- Запрещено: parallax, «летающие» элементы, glow, неон, бесконечные анимации (кроме едва заметного индикатора скролла), bounce, pulse.
- `prefers-reduced-motion` глушит всё глобально (globals.css) — не добавлять JS-анимации в обход.
- Контент по умолчанию **видим**: Reveal лишь добавляет скрытое начальное состояние после гидрации.

## 7. Главная — композиция

1. **Hero** — 100svh фото Eco House, минимум текста: `PAMIR CONSTRUCT`, слоган (`text-hero`), подзаголовок, одна кнопка «Смотреть проекты». Внизу: подпись «На изображении — Eco House · Визуализация» и индикатор скролла.
2. **01 — О компании** — одно крупное высказывание, много воздуха, ссылка на компанию.
3. **02 — Проекты (избранные)** — 2 проекта крупными чередующимися рядами (фото слева/инфо справа, затем наоборот).
4. **Проект в фокусе** — full-bleed фото на всю ширину, имя проекта огромным кеглем поверх.
5. **03 — Преимущества** — крупные цифры + 4 причины + качество строительства.
6. **04 — Другие проекты** — асимметричная сетка из оставшихся проектов.
7. **05 — Компания** — фото + цитата «Дом — это крепость.» + текст; этапы «Путь от выбора до ключей».
8. **06 — Связаться** — CTA на band: крупный заголовок, телефон, форма, контакты.
9. **Footer** — минималистичный, продолжает band.

## 8. Адаптив

Проверять на 375, 768, 1024, 1440, 1920. На мобильном — так же премиально:
крупная типографика (clamp), полные поля 20px, фото на всю ширину контейнера,
никакого горизонтального скролла, touch-цели ≥44px, меню — полноэкранный оверлей.

## 9. Технические ограничения

- Next 16 App Router, статический экспорт на GitHub Pages (`EXPORT=true`, basePath `/pamir`): никаких серверных API в страницах, пути к файлам из `public` — через `asset()` / `<Media>`.
- Server Components по умолчанию; `'use client'` только где нужно состояние/браузер.
- Все тексты — из словарей/контента. Новые строки: `dict.design.*` (уже добавлены).
- Исходники в CRLF: правьте файлы инструментами Edit/Write, не `sed` с `\n`.
- `src/components/variants/*` и `/preview` — не трогать.
