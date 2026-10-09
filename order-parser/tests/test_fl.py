"""FL.ru: разбор реальных RSS-выгрузок (tests/fixtures/fl) и HTTP-логика источника."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx
import pytest
import respx

from order_parser.config import FlConfig
from order_parser.sources.base import SourceError
from order_parser.sources.fl import FEED_URL, FlSource, feed_urls, parse_feed, split_title


def load(fixtures, name: str) -> bytes:
    return (fixtures / "fl" / name).read_bytes()


def test_parse_real_feed_2026(fixtures):
    channel, orders = parse_feed(load(fixtures, "rss_all_2026-06-17.xml"))
    assert channel == "Заказы на FL.ru (Фри-ланс)"
    assert len(orders) == 60
    assert len({o.external_id for o in orders}) == 60

    first = orders[0]
    assert first.source == "fl"
    assert first.external_id == "5509193"
    assert first.title == "SEO-продвижение"
    assert first.budget == "250 000 ₽"
    assert first.url == "https://www.fl.ru/projects/5509193/seo-prodvijenie.html"
    assert first.published_at == datetime(2026, 6, 11, 18, 51, 2, tzinfo=timezone.utc)
    assert first.description.startswith("Два проекта. Тематика 18+.\nУлучшить позиции")
    assert first.raw["categories"] == ["Продвижение сайтов (SEO, GEO) / Продвижение сайтов SEO"]

    # «(для всех)» без бюджета не должен попадать ни в заголовок, ни в бюджет
    no_budget = next(o for o in orders if o.external_id == "5509828")
    assert no_budget.title == "Сделать в программе компас ген план"
    assert no_budget.budget == ""

    with_budget = [o for o in orders if o.budget]
    assert len(with_budget) == 24
    assert all(o.budget.endswith("₽") for o in with_budget)
    for order in orders:
        assert "&#" not in order.title and "&#" not in order.description and "&quot;" not in order.description
        assert "Бюджет:" not in order.title
        assert order.url.startswith("https://www.fl.ru/projects/")


def test_parse_category_feed(fixtures):
    channel, orders = parse_feed(load(fixtures, "rss_category5_2026-06-17.xml"))
    assert channel == "Заказы на FL.ru (Фри-ланс: Программирование)"
    assert len(orders) == 60
    assert all(o.raw["categories"] for o in orders)


def test_parse_old_feed_with_other_currencies(fixtures):
    channel, orders = parse_feed(load(fixtures, "rss_all_2019-10-11.xml"))
    assert len(orders) == 59
    assert orders[0].budget == "50000 руб."
    assert any("$" in o.budget for o in orders)


@pytest.mark.parametrize(
    ("raw", "title", "budget"),
    [
        ("SEO-продвижение (Бюджет: 250 000  &#8381;, для всех)", "SEO-продвижение", "250 000 ₽"),
        ("Сделать бота (Бюджет: 1500  &#8381;)", "Сделать бота", "1500 ₽"),
        ("Сделать план (для всех)", "Сделать план", ""),
        ("Бот (на aiogram) для магазина", "Бот (на aiogram) для магазина", ""),
        ("Фото (Бюджет: 100 $)", "Фото", "100 $"),
    ],
)
def test_split_title(raw, title, budget):
    assert split_title(raw) == (title, budget)


def test_non_rss_is_error():
    with pytest.raises(SourceError, match="не RSS"):
        parse_feed(b"<!DOCTYPE html><html><body>DDoS-Guard</body></html>")


def test_feed_urls():
    assert feed_urls(FlConfig()) == [FEED_URL]
    assert feed_urls(FlConfig(categories=[5, 2], subcategories=[279])) == [
        f"{FEED_URL}?category=5", f"{FEED_URL}?category=2", f"{FEED_URL}?subcategory=279",
    ]


@respx.mock
async def test_fetch_ok(fixtures):
    route = respx.get(FEED_URL).mock(return_value=httpx.Response(200, content=load(fixtures, "rss_all_2026-06-17.xml")))
    source = FlSource(retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 60
    request = route.calls.last.request
    assert "Mozilla/5.0" in request.headers["User-Agent"]
    assert "rss" in request.headers["Accept"]


@respx.mock
async def test_fetch_warmup_after_ddos_guard(fixtures):
    feed = respx.get(FEED_URL).mock(side_effect=[
        httpx.Response(403, text="<html>DDoS-Guard</html>"),
        httpx.Response(200, content=load(fixtures, "rss_all_2026-06-17.xml")),
    ])
    home = respx.get("https://www.fl.ru/").mock(return_value=httpx.Response(200, text="<html></html>"))
    source = FlSource(retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 60 and home.called and feed.call_count == 2


@respx.mock
async def test_fetch_html_instead_of_rss_is_error():
    respx.get(FEED_URL).mock(return_value=httpx.Response(200, text="<html>captcha</html>"))
    respx.get("https://www.fl.ru/").mock(return_value=httpx.Response(200, text="<html></html>"))
    source = FlSource(retries=0)
    try:
        with pytest.raises(SourceError):
            await source.fetch()
    finally:
        await source.aclose()


@respx.mock
async def test_one_category_failing_keeps_others(fixtures):
    respx.get(f"{FEED_URL}?category=5").mock(return_value=httpx.Response(200, content=load(fixtures, "rss_category5_2026-06-17.xml")))
    respx.get(f"{FEED_URL}?category=1").mock(return_value=httpx.Response(500))
    respx.get("https://www.fl.ru/").mock(return_value=httpx.Response(200))
    source = FlSource(FlConfig(categories=[5, 1]), retries=0)
    source_pause = source.gather_pages

    async def no_pause(items, fetch_one, pause=0, **kwargs):
        return await source_pause(items, fetch_one, pause=0, **kwargs)

    source.gather_pages = no_pause  # type: ignore[method-assign]
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 60
