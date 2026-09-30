# Фотографии — источники и лицензии

## Изображения проектов Pamir Construct — `public/photos/projects/`

Собственные рендеры и фотографии застройщика, взяты со старого сайта
**pamirconstruct.md** (разделы проектов и «О компании») 2026-09-29. Это материалы
самого Pamir Construct, а не сток, поэтому они используются как обложки проектов.

| Файл | Проект | Что это | Источник (pamirconstruct.md/images/…) |
|---|---|---|---|
| `eco-house/hero.jpg`, `eco-house/cover.jpg` | Eco House | рендер (кроп) | `project/2021/10/IMG-c037bacd2c1335156a4d561eef955c1e-V.jpg` |
| `botanic-star-2-blocks-3-4/cover-v2.jpg` | Botanic Star 2, бл. 3–4 | рендер, кроп без логотипа (v2 — уточнённый кроп 1300×1074; новое имя сбрасывает кэш оптимизатора изображений) | `project/2022/12/Screenshot_20221202-213459_Gallery.jpg` |
| `botanic-star-2-block-2/cover.jpg` | Botanic Star 2, бл. 2 | рендер; логотип убран из неба (`scripts/clean-logo-b2.mjs`) | `project/2021/01/IMG-3a43a20c366d2316a7fa66a1386c3287-V.jpg` |
| `botanic-star-2-block-1/cover.jpg` | Botanic Star 2, бл. 1 | рендер | `project/2019/10/site-1.jpg` |
| `company/about.jpg` | Botanic Star 2, бл. 1 | рендер | `service/000023850447.jpg` |
| `botanic-star/cover.jpg`, `gallery-1…4.jpg` | Botanic Star | фото | `plan/NIK_6989.jpg`, `NIK_6991`, `NIK_6983`, `NIK_6984`, `gggg.jpg` |
| `botanic-park/gallery-2.jpg` | Botanic Park | фото | `plan/bot.jpg` |
| `botanic-park/cover-v2.jpg` | Botanic Park | фото; обложка и герой в контенте. Исходник `gallery-1` (`assets/photos-src/botanic-park/g1.jpg`, фасад в кадре из деревьев), кроп `[0, 0, 1800, 1059]` — снизу срезано 11,5 % (фургон, фонари, вывеска «Продажа торговых помещений», крыши машин), 1800×1059, mozjpeg q80. Уличный кадр `project/2020/07/park-1.jpg` (столб, провода, машины) не используется | `plan/park.jpg` |

- Рендеры на сайте всегда подписаны «Визуализация / Vizualizare» (`coverKind: 'render'`).
- Исходники (~15 МБ) лежат в `assets/photos-src/` (в `.gitignore`). Веб-версии собирает
  `node scripts/process-photos.mjs` (кроп, ресайз, mozjpeg), после `node scripts/clean-logo-b2.mjs`.
- Разрешение исходных рендеров невысокое (1080–1280 px по ширине). Для full-bleed
  блоков нужны оригиналы от архитектора (`Creative Architecture`) ≥ 2560 px — см. `PLACEHOLDERS.md`.
- Снимок Botanic Star с баннером телефона и вывеской «Invest Garant Grup»
  (`project/2020/07/dddd.jpg`) сознательно не используется.

## Атмосферные стоковые фото — `public/photos/*.jpg`

Изображения ниже — временные, со свободной лицензией.

| Файл | Источник | Автор | Лицензия |
|---|---|---|---|
| `hero-residential.jpg` | [Unsplash](https://unsplash.com/photos/4453DIQWtsQ) | Tobias Wilden | Unsplash License — коммерческое использование и модификация разрешены, атрибуция не требуется |
| `about-facade.jpg` | [Unsplash](https://images.unsplash.com/photo-1760235674447-fe0cc115b697) | Unsplash | Unsplash License |
| `quality-site.jpg` | [Unsplash](https://images.unsplash.com/photo-1769284013173-47150b8c7e51) | Unsplash | Unsplash License |
| `interior-living.jpg` | [Pexels](https://www.pexels.com/photo/5998120/) | Max Vakhtbovych | Pexels License — коммерческое использование и модификация разрешены, атрибуция не требуется |

## Правила, по которым эти фото используются

**Только атмосфера.** Герой, секция о компании, качество строительства, интерьер.

**Никогда — обложки проектов.** Обложки проектов — только собственные рендеры и фото Pamir
(раздел выше). Стоковый дом под подписью
«Botanic Star 2, str. Ghica Vodă 3» — это введение покупателя в заблуждение, и `PLACEHOLDERS.md`
это прямо запрещает: «Nothing here is invented data shown as fact».

**Почему лицензии недостаточно.** Ни Unsplash License, ни Pexels License не дают property release
и trademark release — они лицензируют только авторское право фотографа. Разрешение на использование
снимка не даёт права выдавать чужое здание за своё. Часть кадров — узнаваемые постройки конкретных
архитектурных бюро, их находят обратным поиском по картинке за секунды.

**Люди в кадре.** Условия Pexels запрещают использовать снимки с узнаваемыми людьми так, чтобы это
подразумевало их одобрение. Подпись вроде «наши инженеры» под стоковым кадром — нарушение.
Поэтому в `quality-site.jpg` людей нет.

## Вес

Суммарно ~1.4 МБ на четыре файла. В экспортном режиме стоит `images.unoptimized: true` — ни AVIF,
ни ресайза, файл уходит в браузер как есть. Поэтому размеры подобраны вручную через параметры CDN
(`w=`, `q=`), а не отданы на откуп сборке.
