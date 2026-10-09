# Фикстуры

Парсеры тестируются на сохранённых ответах сайтов. Из облачного окружения, где писался проект,
сайты бирж были недоступны (сетевая политика), поэтому использованы ответы, которые другие
открытые проекты сохранили со своих ПК. Ниже — откуда взят каждый файл и насколько он «настоящий».

Свежие ответы со своего ПК можно сохранить командой `python -m order_parser.capture`
(попадут в `tests/fixtures/live/`, проверка — `pytest tests/test_live_fixtures.py`).

## fl/ — FL.ru RSS (дословные ответы сайта)

| Файл | Запрос | Когда | Откуда |
|---|---|---|---|
| `rss_all_2026-06-17.xml` | `GET https://www.fl.ru/rss/all.xml` | 2026-06-17 16:18 UTC | [volk6022/Atomic-Scraper-Service](https://github.com/volk6022/Atomic-Scraper-Service) `experiment_monitoring/experiment-fl/samples/fl_rss_base.xml` (коммит 03eb09b) |
| `rss_category5_2026-06-17.xml` | `?category=5` (Программирование) | 2026-06-17 17:19 UTC | там же, `fl_rss_cat5.xml` |
| `rss_category1_unknown_2026-06-17.xml` | `?category=1` (несуществующая категория: общий заголовок канала, 2 заказа) | 2026-06-17 16:18 UTC | там же, `fl_rss_category_1.xml` |
| `rss_all_2019-10-11.xml` | `GET https://www.fl.ru/rss/all.xml` (старый формат: «руб.», «$») | 2019-10-11 | [bpteam/freelance-rss-parser-php](https://github.com/bpteam/freelance-rss-parser-php) `tests/fixtures/fl.ru-2019-10-11-feed.xml` |

Файлы скопированы байт в байт.

## kwork/ — Kwork (настоящие ответы, обезличены)

| Файл | Запрос | Когда | Откуда |
|---|---|---|---|
| `projects_c11_2026-06-18.json` | `POST https://kwork.ru/projects`, `c=11`, `X-Requested-With: XMLHttpRequest` | 2026-06-18 | volk6022/Atomic-Scraper-Service `experiment_monitoring/experiment-kwork/samples/xhr/category_11.json` |
| `projects_page_2026-06-18.html` | `GET https://kwork.ru/projects` (страница с `window.stateData`) | 2026-06-18 14:16 UTC | там же, `samples/httpx/kwork_projects_full.html` |

Изменения относительно оригинала: в JSON оставлены первые 4 проекта из 12 (в `pagination.data` и
`wants`); в обоих файлах логины, ID и аватары покупателей заменены на `buyer1`, `buyer2`…
Остальные поля — как в ответе сайта.

## habr/ — Habr Freelance (настоящая страница, перекодирована)

| Файл | Запрос | Когда | Откуда |
|---|---|---|---|
| `tasks_q-python_2022-06-13.html` | `GET https://freelance.habr.com/tasks?q=Python` | 2022-06-13 | [Magomedov888/parsing_habr](https://github.com/Magomedov888/parsing_habr) `fl_habr.html` |

Автор репозитория сохранил страницу в Windows-1251; здесь она перекодирована обратно в UTF-8,
содержимое не менялось. Более свежих сохранённых страниц нет: сервис закрыт 28.02.2025, а разметка
списка (по коду парсеров 2020–2025 гг.) до закрытия не менялась.

## freelancer/ — Freelancer.com (РЕКОНСТРУКЦИЯ из реальных данных)

| Файл | Что это |
|---|---|
| `active_reconstructed_2026-08-29.json` | ответ `GET /api/projects/0.1/projects/active/`, собранный по документированной схеме из 5 реальных проектов |

Дословного ответа API в открытом доступе найти не удалось. Данные проектов (id, заголовки, тексты,
`seo_url`, бюджеты, валюты, тип fixed/hourly, время публикации, навыки) — настоящие: их выгрузил с
этого же публичного эндпоинта проект [ar0per0/buscador_proyectos_freelancer](https://github.com/ar0per0/buscador_proyectos_freelancer)
(`freelancer_jobs.json`, 2026-08-29), но в своём, упрощённом формате. Здесь они разложены обратно в
структуру ответа API (`status`, `result.projects[]`, `budget.minimum/maximum`, `currency{code,sign,exchange_rate}`,
`submitdate`, `jobs[].name`), описанную в официальных SDK и проверенную сторонними проектами в
августе–октябре 2026. Курс `exchange_rate` для INR приблизительный. Поля `bidperiod`, `status`,
`frontend_project_status` проставлены типовыми значениями.
