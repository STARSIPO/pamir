# Редизайн Pamir Construct — состояние работы

**Дата:** 2026-09-30
**Ветка:** `redesign/architectural` (локально, в origin не отправлена)
**ТЗ:** полный визуальный редизайн по направлению solomon.md / inamstro.md,
3 цветовые темы, первой — Variant 1 Warm Architectural. Правила — `docs/DESIGN-SYSTEM.md`.

---

## 1. Что сделано

### Фундамент (готово, проверено)
- **Темы:** `src/config/theme.ts` → `SITE_THEME = 'warm' | 'dark' | 'stone'`. Токены всех трёх
  палитр — `src/app/globals.css`. Семантические классы Tailwind: `canvas`, `ink`, `muted`,
  `accent`, `band`, `line`, `scrim`. Превью без пересборки: `?theme=dark` в URL.
- **Типографика:** Inter Tight (display, light) + Inter (текст), шкала `text-hero`,
  `text-display-xl/lg/md/sm`, `text-lead`, `.label` (`tailwind.config.ts`).
- **Сетка/отступы:** fluid `.container` (max 1680, поля clamp), `py-section`, `gap-gutter`,
  скругления 0, теней нет.
- **Компоненты:** `ui/Reveal` (fade / mask / stagger), `ui/Media` (градинг фото, hover-zoom,
  подпись «Визуализация»), `ui/Button` (+ `Arrow`, `ArrowLabel`), `ui/Section`,
  `ui/SectionHeading`, `ui/StatusBadge`, `projects/ProjectCard`, `shared/PageHero`,
  `shared/CtaBand`, `brand/Logo` (монохромный), `layout/SmoothScroll` (Lenis) +
  `lib/smooth-scroll.ts` (`lockScroll`).
- **Фото:** 14 реальных рендеров/фото Pamir со старого pamirconstruct.md →
  `public/photos/projects/` (3.3 МБ). Подключены в `src/content/projects.ts`
  (`cover`, `hero`, `coverKind`, `gallery`). Источники — `docs/IMAGE-CREDITS.md`.
  Исходники в `assets/photos-src/` (в .gitignore), пайплайн: `scripts/clean-logo-b2.mjs`,
  затем `scripts/process-photos.mjs`.
- **Словари:** новый блок `design.*` в `src/i18n/dictionaries/ru.ts` и `ro.ts`.
- **Документация:** `docs/DESIGN-SYSTEM.md`, README (раздел Themes), PLACEHOLDERS, IMAGE-CREDITS.

### Сборка страниц (workflow из 8 агентов — остановлен при выключении ПК)
Агенты успели написать все файлы; остановлены на этапе самопроверки скриншотами.
На момент коммита: `tsc --noEmit` — чисто, `eslint src --quiet` — чисто, `/ru` и
`/ru/projects/eco-house` отдают 200. **Визуально результат ещё не проверен.**

| Зона | Файлы |
|---|---|
| Hero + 01 О компании | `home/Hero.tsx`, `home/AboutBrief.tsx` |
| 02 Проекты, фокус, 04 другие | `home/FeaturedProjects.tsx`, `home/ProjectFeature.tsx`, `home/Spotlight.tsx`, `home/MoreProjects.tsx` |
| 03 Преимущества, качество | `home/Advantages.tsx`, `home/Quality.tsx`, `ui/Counter.tsx` (удалены `WhyUs`, `Stats`) |
| 05 Компания, этапы, 06 CTA, форма | `home/CompanyBrief.tsx`, `home/Steps.tsx`, `home/LeadSection.tsx`, `forms/LeadForm.tsx`, `shared/ContactInfo.tsx` (удалён `ContactMap`) |
| Шапка, меню, футер | `layout/Header.tsx`, `layout/MobileMenu.tsx`, `layout/LanguageSwitcher.tsx`, `layout/Footer.tsx` |
| Каталог | `app/[locale]/projects/page.tsx`, `projects/ProjectsExplorer.tsx` |
| Страница проекта | `app/[locale]/projects/[slug]/page.tsx`, `project/ProjectHero.tsx`, `project/Gallery.tsx`, `project/Floorplans.tsx` |
| Внутренние страницы | company, services, faq (+`shared/Accordion`), contacts, privacy, thank-you, 404 (`shared/NotFoundView`), `ui/FeatureIcon` |

Композиция главной — `src/app/[locale]/page.tsx`.

---

## 2. Что осталось

1. **Визуальная проверка всех страниц** на 390 / 768 / 1024 / 1440 / 1920 и во всех трёх
   темах (`?theme=dark`, `?theme=stone`). Проверить: шапка прозрачная → компактная при скролле,
   мобильное меню, аккордеон FAQ, лайтбокс галереи, диалог планировок, форма (валидация).
2. Исправить найденное (второй workflow: ревьюеры по страницам → исправления по владельцам файлов).
3. `npm run build` и статический экспорт:
   `EXPORT=true NEXT_PUBLIC_STATIC=1 NEXT_PUBLIC_BASE_PATH=/pamir npm run build`
   (проверить пути к фото под basePath `/pamir`).
4. Решить, коммитить ли `AGENTS.md` / `CLAUDE.md` — их создаёт `next dev` (Next 16) сам.
5. Слить в `main` → GitHub Actions задеплоит на https://starsipo.github.io/pamir/.

## 3. Инструменты проверки

Dev-сервер: `npx next dev -p 3000`.

- `node scripts/qa/shoot.mjs <url> <w> <h> <outPrefix> [--mobile] [--theme=dark]` —
  полностраничные скриншоты через headless Edge (CDP), куски по 2 экрана + флаг
  горизонтального переполнения.
- `node scripts/qa/interact.mjs <url> <w> <h> <outPrefix> --steps='[{"scroll":600},{"shot":"x"},{"click":"button"}]'` —
  скриншоты интерактивных состояний + ошибки консоли.
- `scripts/qa/build-workflow.js` — скрипт workflow сборки (ТЗ для каждого из 8 агентов,
  полезно как спецификация зон).

## 4. Не трогалось

`src/components/variants/*`, `src/app/[locale]/preview/*`, `src/content/demo-inventory.ts`
и правка `src/app/robots.ts` — незакоммиченная работа из прошлой сессии, в этот коммит
включена как есть, чтобы ничего не потерять.
