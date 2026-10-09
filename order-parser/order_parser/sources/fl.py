"""FL.ru: RSS-лента заказов https://www.fl.ru/rss/all.xml (с фильтром по категориям).

Формат проверен по реальным выгрузкам ленты (2019, 2023, июнь 2026):
* бюджет есть только в конце заголовка: «Название (Бюджет: 250 000  &#8381;, для всех)»;
  без бюджета — «Название (для всех)» или просто «Название»;
* внутри CDATA остаются HTML-сущности (&#8381;, &quot;) — их нужно раскодировать;
* pubDate в GMT; первым в общей ленте может идти старый платный закреплённый заказ;
* сайт за DDoS-Guard: на подозрительные запросы отвечает 403 или HTML вместо XML.
"""

from __future__ import annotations

import calendar
import html
import logging
import re
from datetime import datetime, timezone

import feedparser
import httpx

from order_parser.config import FlConfig
from order_parser.models import Order
from order_parser.sources import SOURCE_META
from order_parser.sources.base import HttpSource, SourceError

log = logging.getLogger(__name__)

BASE_URL = "https://www.fl.ru"
FEED_URL = f"{BASE_URL}/rss/all.xml"
GENERIC_CHANNEL_TITLE = "Заказы на FL.ru (Фри-ланс)"

RSS_HEADERS = {"Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7"}

_TITLE_TAIL = re.compile(
    r"\s*\((?:Бюджет:\s*(?P<budget>[^,()]+?)\s*(?:,\s*(?P<vis1>для всех))?|(?P<vis2>для всех))\)\s*$",
    re.IGNORECASE,
)
_PROJECT_ID = re.compile(r"/projects/(\d+)")
_TAG = re.compile(r"<[^>]+>")


def feed_urls(cfg: FlConfig) -> list[str]:
    """Одна лента на категорию/подкатегорию; без настроек — общая лента."""
    urls = [f"{FEED_URL}?category={c}" for c in cfg.categories]
    urls += [f"{FEED_URL}?subcategory={s}" for s in cfg.subcategories]
    return urls or [FEED_URL]


def split_title(raw_title: str) -> tuple[str, str]:
    """«Название (Бюджет: 10 000 ₽, для всех)» → («Название», «10 000 ₽»)."""
    title = " ".join(html.unescape(raw_title).split())
    match = _TITLE_TAIL.search(title)
    if not match:
        return title, ""
    budget = " ".join((match.group("budget") or "").split())
    return title[: match.start()].strip(), budget


def _clean_description(value: str) -> str:
    text = html.unescape(_TAG.sub("", value.replace("<br>", "\n").replace("<br />", "\n")))
    return text.replace("\r\n", "\n").strip()


def _published(entry) -> datetime | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    return datetime.fromtimestamp(calendar.timegm(parsed), tz=timezone.utc)


def looks_like_rss(content: bytes) -> bool:
    head = content[:500].lstrip(b"\xef\xbb\xbf \t\r\n").lower()
    return head.startswith((b"<?xml", b"<rss"))


def parse_feed(content: bytes) -> tuple[str, list[Order]]:
    """Разбирает RSS FL.ru. Возвращает (заголовок канала, заказы)."""
    if not looks_like_rss(content):
        raise SourceError("FL.ru вернул не RSS (возможно, страница защиты DDoS-Guard)")
    feed = feedparser.parse(content)
    if feed.get("bozo") and not feed.entries:
        raise SourceError(f"FL.ru: не удалось разобрать RSS: {feed.get('bozo_exception')}")
    orders: list[Order] = []
    for entry in feed.entries:
        link = (entry.get("link") or entry.get("id") or "").strip()
        match = _PROJECT_ID.search(link)
        if not match:
            continue
        title, budget = split_title(entry.get("title", ""))
        categories = [html.unescape(t.get("term", "")).strip() for t in entry.get("tags", []) if t.get("term")]
        orders.append(Order(
            source="fl",
            external_id=match.group(1),
            title=title,
            description=_clean_description(entry.get("summary", "")),
            budget=budget,
            url=link if link.startswith("http") else BASE_URL + link,
            published_at=_published(entry),
            raw={"title": entry.get("title", ""), "categories": categories, "link": link,
                 "published": entry.get("published", "")},
            currency="RUB",
        ))
    return html.unescape(feed.feed.get("title", "")), orders


class FlSource(HttpSource):
    name = "fl"
    emoji, title = SOURCE_META["fl"]

    def __init__(self, cfg: FlConfig | None = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.cfg = cfg or FlConfig()
        self._warmed_up = False

    async def fetch(self) -> list[Order]:
        return await self.gather_pages(feed_urls(self.cfg), self._fetch_feed, pause=1.5)

    async def _fetch_feed(self, url: str) -> list[Order]:
        try:
            content = await self._download(url)
        except (httpx.HTTPStatusError, SourceError) as exc:
            blocked = isinstance(exc, SourceError) or exc.response.status_code == 403
            if self._warmed_up or not blocked:
                raise
            # DDoS-Guard иногда пропускает только после захода на главную (ставит cookies __ddg*).
            log.info("FL.ru: %s — захожу на главную за cookies и повторяю", exc)
            self._warmed_up = True
            await self.get(BASE_URL + "/")
            content = await self._download(url)
        channel, orders = parse_feed(content)
        if "?" in url and channel.strip() == GENERIC_CHANNEL_TITLE:
            log.warning("FL.ru: категория в %s не распознана сайтом (общий заголовок канала) — проверьте номер", url)
        return orders

    async def _download(self, url: str) -> bytes:
        response = await self.get(url, headers=RSS_HEADERS)
        if not looks_like_rss(response.content):
            raise SourceError("FL.ru вернул не RSS (возможно, страница защиты DDoS-Guard)")
        return response.content
