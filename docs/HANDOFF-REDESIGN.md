# Редизайн Pamir Construct — состояние работы

**Дата:** 2026-09-30
**Ветка:** `redesign/architectural` (локально, в origin не отправлена; `main` не тронут)
**ТЗ:** полный визуальный редизайн по направлению solomon.md / inamstro.md,
3 цветовые темы, основная — Variant 1 Warm Architectural. Правила — `docs/DESIGN-SYSTEM.md`.

---

## 1. Статус: готово к ревью и деплою

- Все страницы переработаны: главная, каталог, страница проекта, компания, услуги, FAQ,
  контакты, политика, спасибо, 404. RU и RO.
- **Темы:** `src/config/theme.ts` → `SITE_THEME = 'warm' | 'dark' | 'stone'`. Превью без
  пересборки: `?theme=dark` / `?theme=stone` в URL (держится на сессию, `?theme=reset`).
- **Фото:** реальные рендеры и фото Pamir со старого pamirconstruct.md → `public/photos/projects/`.
  Рендеры подписаны «Визуализация». Источники и кропы — `docs/IMAGE-CREDITS.md`.
- **Проверка:** 4 круга визуального QA (7 ревьюеров: 390 / 768 / 1024 / 1440 / 1920, три темы,
  интерактив, доступность) + исправления по зонам. Серьёзных замечаний не осталось.
- **Сборка:** `tsc --noEmit` и `eslint src` — чисто. Статический экспорт как в CI
  (`EXPORT=true NEXT_PUBLIC_STATIC=1 NEXT_PUBLIC_BASE_PATH=/pamir`) собирается; под `/pamir`
  все фото грузятся, битых изображений и ошибок консоли нет, иконки (`/pamir/icon.svg`,
  `/pamir/apple-icon.png`) отдают 200, по одному `h1` на странице.

## 2. Что осталось (не блокирует)

1. **Серверный `lang` для RO.** `<html lang="ru">` захардкожен в `src/app/layout.tsx`; скрипт
   в `themeBootScript` ставит `ro-MD` до первой отрисовки, но краулеры без JS видят `ru`.
   Правильно — перенести `<html>/<body>` в `src/app/[locale]/layout.tsx` (route groups +
   отдельный root layout для `/` и `not-found`).
2. **Материалы от заказчика** (см. `PLACEHOLDERS.md`): рендеры в высоком разрешении (≥ 2560 px,
   без логотипов), рендер BS2 бл. 3–4 без плашки логотипа, актуальные фото стройки,
   реальные планировки, подтверждение цифр «10+ лет» и «500+ квартир».
3. Мелкий полиш из последнего ревью (все minor): «последнее слово на строке» в шагах,
   2 колонки списка «Качество» на 320 px, чуть плотнее скрим у hero на планшете,
   высота ссылок футера на десктопе.
4. Решить, коммитить ли `AGENTS.md` / `CLAUDE.md` — их создаёт `next dev` (Next 16) сам.
5. **Деплой:** слить ветку в `main` и запушить → GitHub Actions соберёт экспорт и выложит на
   https://starsipo.github.io/pamir/.

## 3. Инструменты

Dev-сервер: `npx next dev -p 3000`.

- `node scripts/qa/shoot.mjs <url> <w> <h> <outPrefix> [--mobile] [--theme=dark]` —
  полностраничные скриншоты (headless Edge + CDP), куски по 2 экрана, флаг горизонтального
  переполнения. Скриншот «на лету» может не успеть раскрыть reveal-блоки — живой вьюпорт
  проверяйте через `interact.mjs`.
- `node scripts/qa/interact.mjs <url> <w> <h> <outPrefix> --steps='[{"scroll":600},{"shot":"x"},{"click":"button"}]'` —
  интерактивные состояния, JS-логи, ошибки консоли.
- Фото: `node scripts/clean-logo-b2.mjs && node scripts/process-photos.mjs`
  (исходники в `assets/photos-src/`, в .gitignore).
- **Под Git Bash** экспорт запускать с `MSYS_NO_PATHCONV=1`, иначе `/pamir` превращается
  в `C:/Program Files/Git/pamir`. Не подключайте `node_modules` в worktree через junction:
  Turbopack его отвергает, а `npm ci` через junction вычищает исходный `node_modules`.
