"""Habr Freelance: разбор сохранённой страницы /tasks и реакция на закрытие сервиса."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx
import pytest
import respx

from order_parser.config import HabrConfig
from order_parser.sources.base import SourceError
from order_parser.sources.habr import RSS_URL, TASKS_URL, HabrSource, parse_relative, parse_tasks_html, parse_tasks_rss

NOW = datetime(2022, 6, 13, 12, 0, tzinfo=timezone.utc)


@pytest.fixture
def page(fixtures) -> str:
    return (fixtures / "habr" / "tasks_q-python_2022-06-13.html").read_text(encoding="utf-8")


def test_parse_real_page(page):
    orders = parse_tasks_html(page, now=NOW)
    assert len(orders) == 25
    first = orders[0]
    assert first.source == "habr"
    assert first.external_id == "438733"
    assert first.title == "Разработать библиотеку на python3"
    assert first.budget == "2 500 руб. за час"
    assert first.url == "https://freelance.habr.com/tasks/438733"
    assert first.description == "Теги: python3, keras"
    assert first.published_at == NOW - timedelta(days=7)
    assert first.raw["responses"] == "6"

    negotiated = next(o for o in orders if o.external_id == "440003")
    assert negotiated.budget == ""  # «договорная»
    marked = [o for o in orders if o.raw["marked"]]
    assert len(marked) == 2
    assert any(o.raw["safe_deal"] for o in orders)


@pytest.mark.parametrize(
    ("text", "delta"),
    [("11 минут назад", timedelta(minutes=11)), ("~ 2 часа назад", timedelta(hours=2)),
     ("~ 21 час назад", timedelta(hours=21)), ("1 день назад", timedelta(days=1)),
     ("7 дней назад", timedelta(days=7)), ("2 недели назад", timedelta(weeks=2))],
)
def test_parse_relative(text, delta):
    assert parse_relative(text, NOW) == NOW - delta


def test_parse_relative_unknown():
    assert parse_relative("вчера", NOW) is None


def test_parse_rss_fallback():
    rss = """<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title>
    <item><title>Telegram &amp;laquo;bot&amp;raquo;</title><link>https://freelance.habr.com/tasks/600001</link>
    <description>&lt;p&gt;Нужен бот&lt;/p&gt;</description><pubDate>Mon, 13 Jun 2022 10:00:00 +0300</pubDate></item>
    </channel></rss>""".encode()
    orders = parse_tasks_rss(rss)
    assert len(orders) == 1
    assert orders[0].external_id == "600001"
    assert orders[0].description == "Нужен бот"
    assert orders[0].published_at == datetime(2022, 6, 13, 7, 0, tzinfo=timezone.utc)


@respx.mock
async def test_fetch_with_categories(page):
    route = respx.get(TASKS_URL).mock(return_value=httpx.Response(200, text=page))
    source = HabrSource(HabrConfig(categories=["development_bots", "development_backend"]), retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 25
    assert route.calls.last.request.url.params["categories"] == "development_bots,development_backend"


@respx.mock
async def test_closed_site_reports_clear_error():
    respx.get(TASKS_URL).mock(return_value=httpx.Response(410, text="Gone"))
    source = HabrSource(retries=0)
    try:
        with pytest.raises(SourceError, match="закрыт 28.02.2025"):
            await source.fetch()
    finally:
        await source.aclose()


@respx.mock
async def test_stub_page_without_tasks_tries_rss_then_fails():
    respx.get(TASKS_URL).mock(return_value=httpx.Response(200, text="<html><body>Сервис закрыт</body></html>"))
    rss = respx.get(RSS_URL).mock(return_value=httpx.Response(404))
    source = HabrSource(retries=0)
    try:
        with pytest.raises(SourceError, match="закрыт"):
            await source.fetch()
    finally:
        await source.aclose()
    assert rss.called


@respx.mock
async def test_redirect_away_is_closed():
    respx.get(TASKS_URL).mock(return_value=httpx.Response(302, headers={"Location": "https://habr.com/ru/"}))
    respx.get("https://habr.com/ru/").mock(return_value=httpx.Response(200, text="<html>habr</html>"))
    source = HabrSource(retries=0)
    try:
        with pytest.raises(SourceError, match="перенаправление"):
            await source.fetch()
    finally:
        await source.aclose()
