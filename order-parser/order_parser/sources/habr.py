"""Habr Freelance: список задач https://freelance.habr.com/tasks.

ВНИМАНИЕ: сервис закрыт 28.02.2025 (пост «Мы закрываем Хабр Фриланс» в блоге Хабра),
поэтому источник по умолчанию выключен (SOURCE_HABR=false). Модуль оставлен рабочим:
если сайт снова начнёт отдавать задачи, достаточно включить флаг.

Что проверено:
* RSS: в <head> страницы была ссылка <link rel="alternate" type="application/rss+xml" href="/rss/tasks">,
  но сохранённых образцов ленты нет, и фильтра по категориям у неё нет. Поэтому основной способ —
  HTML-список (разметка подтверждена сохранённой страницей и парсерами 2020–2025 гг.),
  а лента /rss/tasks — запасной вариант, если в HTML не нашлось ни одной задачи;
* в списке нет текста заказа и точной даты: описание собирается из тегов,
  дата — из относительного «~ 2 часа назад».
"""

from __future__ import annotations

import calendar
import html
import logging
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

import feedparser
import httpx
from bs4 import BeautifulSoup

from order_parser.config import HabrConfig
from order_parser.models import Order
from order_parser.sources import SOURCE_META
from order_parser.sources.base import HttpSource, SourceError

log = logging.getLogger(__name__)

BASE_URL = "https://freelance.habr.com"
TASKS_URL = f"{BASE_URL}/tasks"
RSS_URL = f"{BASE_URL}/rss/tasks"
CLOSED_NOTE = "Habr Freelance закрыт 28.02.2025 — выключите SOURCE_HABR в .env"

_TASK_ID = re.compile(r"/tasks/(\d+)")
_RELATIVE = re.compile(r"(\d+)\s*(минут|час|д[ен]|недел|месяц|секунд)", re.IGNORECASE)


def parse_relative(text: str, now: datetime) -> datetime | None:
    """«11 минут назад», «~ 2 часа назад», «1 день назад» → datetime."""
    value = " ".join(text.lower().split())
    if "только что" in value or "сейчас" in value:
        return now
    match = _RELATIVE.search(value)
    if not match:
        return None
    amount, unit = int(match.group(1)), match.group(2)
    if unit.startswith("секунд"):
        delta = timedelta(seconds=amount)
    elif unit.startswith("минут"):
        delta = timedelta(minutes=amount)
    elif unit.startswith("час"):
        delta = timedelta(hours=amount)
    elif unit.startswith("недел"):
        delta = timedelta(weeks=amount)
    elif unit.startswith("месяц"):
        delta = timedelta(days=30 * amount)
    else:
        delta = timedelta(days=amount)
    return now - delta


def _text(node) -> str:
    return " ".join(node.get_text(" ", strip=True).split()) if node is not None else ""


def parse_tasks_html(page: str, now: datetime | None = None) -> list[Order]:
    """HTML страницы /tasks → заказы. Пустой список, если задач на странице нет."""
    now = now or datetime.now(timezone.utc)
    soup = BeautifulSoup(page, "html.parser")
    orders: list[Order] = []
    for article in soup.select("article.task"):
        title_box = article.select_one(".task__title")
        link = title_box.select_one("a[href]") if title_box else None
        if link is None:
            continue
        match = _TASK_ID.search(link["href"])
        if not match:
            continue
        title = (title_box.get("title") or "").strip() or _text(link)
        price = article.select_one(".task__price .count")
        budget = _text(price) if price is not None else ""
        tags = [_text(a) for a in article.select("a.tags__item_link")]
        published = parse_relative(_text(article.select_one(".params__published-at")), now)
        responses = _text(article.select_one(".params__responses .params__count"))
        item = article.find_parent("li")
        marked = bool(item and "content-list__item_marked" in (item.get("class") or []))
        orders.append(Order(
            source="habr",
            external_id=match.group(1),
            title=html.unescape(title),
            description=("Теги: " + ", ".join(tags)) if tags else "",
            budget=budget,
            url=urljoin(BASE_URL, link["href"]),
            published_at=published,
            raw={"tags": tags, "responses": responses, "marked": marked,
                 "safe_deal": article.select_one(".safe-deal-icon") is not None},
            currency="RUB",
        ))
    return orders


def parse_tasks_rss(content: bytes) -> list[Order]:
    """Запасной вариант: лента /rss/tasks (стандартные поля RSS)."""
    feed = feedparser.parse(content)
    orders: list[Order] = []
    for entry in feed.entries:
        link = entry.get("link") or entry.get("id") or ""
        match = _TASK_ID.search(link)
        if not match:
            continue
        parsed = entry.get("published_parsed") or entry.get("updated_parsed")
        orders.append(Order(
            source="habr",
            external_id=match.group(1),
            title=html.unescape(entry.get("title", "")).strip(),
            description=BeautifulSoup(entry.get("summary", ""), "html.parser").get_text("\n").strip(),
            url=urljoin(BASE_URL, link),
            published_at=datetime.fromtimestamp(calendar.timegm(parsed), tz=timezone.utc) if parsed else None,
            raw={"link": link},
            currency="RUB",
        ))
    return orders


class HabrSource(HttpSource):
    name = "habr"
    emoji, title = SOURCE_META["habr"]

    def __init__(self, cfg: HabrConfig | None = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.cfg = cfg or HabrConfig()

    async def fetch(self) -> list[Order]:
        orders: dict[str, Order] = {}
        for page in range(1, self.cfg.pages + 1):
            page_orders = await self._fetch_page(page)
            for order in page_orders:
                orders.setdefault(order.external_id, order)
            if len(page_orders) < 25:
                break
        return list(orders.values())

    async def _fetch_page(self, page: int) -> list[Order]:
        params: dict[str, str] = {}
        if self.cfg.categories:
            params["categories"] = ",".join(self.cfg.categories)
        if page > 1:
            params["page"] = str(page)
        try:
            response = await self.get(TASKS_URL, params=params)
        except httpx.HTTPStatusError as exc:
            raise SourceError(f"HTTP {exc.response.status_code}. {CLOSED_NOTE}") from exc
        if response.url.host != httpx.URL(BASE_URL).host or not response.url.path.startswith("/tasks"):
            raise SourceError(f"перенаправление на {response.url}. {CLOSED_NOTE}")
        if "закрыли Хабр Фриланс" in response.text:
            # заглушка после закрытия: «Мы закрыли Хабр Фриланс, но всегда ждем вас в наших других сервисах»
            raise SourceError(f"сайт показывает заглушку о закрытии. {CLOSED_NOTE}")
        orders = parse_tasks_html(response.text)
        if orders or page > 1:
            return orders
        if re.search(r"id=['\"]tasks_list['\"]", response.text):
            return []  # список есть, просто пустой (например, по узким категориям)
        log.info("Habr Freelance: в HTML нет задач, пробую RSS %s", RSS_URL)
        try:
            rss = await self.get(RSS_URL)
            orders = parse_tasks_rss(rss.content)
        except Exception as exc:  # noqa: BLE001
            raise SourceError(f"нет задач ни в HTML, ни в RSS ({exc.__class__.__name__}). {CLOSED_NOTE}") from exc
        if not orders:
            raise SourceError(f"нет задач ни в HTML, ни в RSS. {CLOSED_NOTE}")
        return orders
