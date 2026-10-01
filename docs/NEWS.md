# Раздел «Новости» — архитектура и спецификация

Главная → «Последние новости» · Новости → категории → список · Новость → статья → проект → другие новости.
Дизайн — `docs/DESIGN-SYSTEM.md` (живая тема Premium Dark; warm/stone тоже должны работать).

## Данные

```
src/lib/news/types.ts       NewsArticle, NewsBlock (контент-блоки), NewsImage, NewsCategory, NewsStatus
src/lib/news/repository.ts  ЕДИНСТВЕННАЯ точка чтения: listNews({category, project, limit}),
                            getNews(slug), featuredNews(), latestNews(n), relatedNews(article, n), newsSlugs()
src/lib/news/format.ts      formatNewsDate(iso, locale) → «30 сентября 2026»
src/content/news/index.ts   локальные DEMO-публикации (demo: true)
```

Поля статьи: `id, slug, title, subtitle, description, content[], date, category, coverImage, images,
relatedProject, featured, author, status, demo, seo`. Тело статьи — упорядоченный список блоков:
`paragraph`, `heading`, `image` (+`wide`), `gallery`, `quote`, `list` (ordered), `video`
(youtube/vimeo/file — на будущее), `project` (карточка-ссылка на проект по slug).

**Подключение CMS / админ-панели.** Сохранить сигнатуры `repository.ts`, заменить тела на запросы к
CMS (на этапе сборки для статического экспорта; async + revalidate на Node-хостинге). Действия
админа = поля документа: добавить/редактировать/удалить — документ; главное фото — `coverImage`;
галерея — `images` и блоки `gallery`; категория — `category`; проект — `relatedProject`; дата —
`date`; Featured — `featured`; опубликовать/скрыть — `status`. Компоненты не знают, откуда данные.

**Демо.** `demo: true` → метка «Демо» на карточке и плашка в статье, `noindex`, нет в sitemap.
Тексты демо-новостей не содержат заявлений компании, достижений, сроков сдачи и событий, которые
можно принять за настоящие.

## Маршруты (статически генерируются)

| Страница | RU | RO |
|---|---|---|
| Список | `/ru/news` | `/ro/noutati` (на статическом экспорте `/ro/news`) |
| Статья | `/ru/news/{slug}` | `/ro/noutati/{slug}` |

`routes.news(l)`, `routes.newsArticle(l, slug)`; один slug на оба языка (латиница, напр.
`noul-site-pamir-construct`). Папки `src/app/[locale]/news/page.tsx`, `src/app/[locale]/news/[slug]/page.tsx`;
`generateStaticParams` × locales, `dynamicParams = false`.

## SEO

У каждой статьи: уникальный `title` (seo.title ?? title), `description` (seo.description ?? description),
canonical + hreflang, Open Graph `type: article` с абсолютным URL изображения (seo.ogImage ?? coverImage.src,
с basePath), `publishedTime`, JSON-LD `NewsArticle`. Демо — `robots: noindex`.

## Компоненты

- `components/news/NewsCard` — карточка (изображение, дата, категория, заголовок, описание, «Подробнее →»),
  используется в списке, «Другие новости», на главной и на странице проекта.
- `components/home/LatestNews` — «Последние новости» на главной (3 карточки, «Все новости →»).
- `components/project/ProjectNews` — «Новости проекта» на странице проекта (null, если новостей нет).

## Визуальные правила

Premium real estate: много воздуха, большие изображения, минималистичная типографика, чёткая сетка,
минимум рамок, токены темы. Hover: изображение увеличивается ~3% медленно, стрелка смещается на 4px,
без подпрыгиваний и теней. Сетка списка: 3 / 2 / 1 колонки (desktop / tablet / mobile), сверху крупная
Featured-карточка. Категории — текстовые табы без перезагрузки страницы.
