"""Kwork: разбор реальных ответов (JSON и window.stateData) и выбор способа загрузки."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs

import httpx
import pytest
import respx

from order_parser.config import KworkConfig
from order_parser.sources.kwork import (
    PROJECTS_URL,
    KworkFormatError,
    KworkSource,
    format_budget,
    parse_json,
    parse_state_html,
)

MSK = timezone(timedelta(hours=3))


@pytest.fixture
def kwork_json(fixtures) -> dict:
    return json.loads((fixtures / "kwork" / "projects_c11_2026-06-18.json").read_text(encoding="utf-8"))


@pytest.fixture
def kwork_html(fixtures) -> str:
    return (fixtures / "kwork" / "projects_page_2026-06-18.html").read_text(encoding="utf-8")


def test_parse_json(kwork_json):
    orders = parse_json(kwork_json)
    assert len(orders) == 4
    first = orders[0]
    assert first.source == "kwork"
    assert first.external_id == "3200484"
    assert first.title == "Интегрировать сайт на modx с crm битрикс"
    assert first.description.startswith("Добрый день, нужно сделать простую интеграцию")
    assert first.budget == "до 1 000 ₽ (допустимо до 3 000 ₽)"
    assert first.budget_value == 3000 and first.currency == "RUB"
    assert first.url == "https://kwork.ru/projects/3200484/view"
    assert first.published_at == datetime(2026, 6, 18, 17, 15, 26, tzinfo=MSK)
    assert first.raw["category_id"] == "38"


def test_parse_state_html(kwork_html):
    orders = parse_state_html(kwork_html)
    assert len(orders) == 12
    assert len({o.external_id for o in orders}) == 12
    for order in orders:
        assert order.title and order.url.startswith("https://kwork.ru/projects/")
        assert order.published_at is not None
        assert "&laquo;" not in order.description and "&mdash;" not in order.description


def test_html_and_json_items_have_same_shape(kwork_json, kwork_html):
    json_first = parse_json(kwork_json)[0]
    html_ids = {o.external_id for o in parse_state_html(kwork_html)}
    assert json_first.raw.keys() >= {"id", "name", "description", "priceLimit", "possiblePriceLimit", "date_create"}
    assert html_ids  # обе формы дают те же объекты-заказы


@pytest.mark.parametrize(
    "payload",
    [{"success": False}, {"success": True, "data": {}}, ["not", "a", "dict"], None],
)
def test_parse_json_errors(payload):
    with pytest.raises(KworkFormatError):
        parse_json(payload)


def test_parse_json_empty_list_is_valid():
    assert parse_json({"success": True, "data": {"pagination": {"data": []}, "wants": []}}) == []


def test_state_missing():
    with pytest.raises(KworkFormatError):
        parse_state_html("<html><script>window.foo = 1;</script></html>")


def test_state_with_braces_in_strings():
    page = (
        '<script>window.stateData = {"wantsListData": {"pagination": {"data": ['
        '{"id": 1, "name": "Сайт {на} React", "description": "текст }] с ;скобками", "priceLimit": "500.00",'
        ' "possiblePriceLimit": 500, "date_create": "2026-06-18 10:00:00"}]}}};window.firebaseConfig = {};</script>'
    )
    orders = parse_state_html(page)
    assert orders[0].title == "Сайт {на} React"
    assert orders[0].budget == "до 500 ₽"


@pytest.mark.parametrize(
    ("price", "possible", "text"),
    [(1000, 3000, "до 1 000 ₽ (допустимо до 3 000 ₽)"), (5000, 5000, "до 5 000 ₽"), (None, None, ""),
     (None, 700, "до 700 ₽")],
)
def test_format_budget(price, possible, text):
    assert format_budget(price, possible) == text


@respx.mock
async def test_fetch_uses_xhr_json(kwork_json):
    route = respx.post(PROJECTS_URL).mock(return_value=httpx.Response(200, json=kwork_json))
    source = KworkSource(KworkConfig(categories=[41]), retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 4
    request = route.calls.last.request
    assert request.headers["X-Requested-With"] == "XMLHttpRequest"
    assert parse_qs(request.content.decode()) == {"c": ["41"], "page": ["1"]}


@respx.mock
async def test_fetch_falls_back_to_state_html(kwork_html):
    respx.post(PROJECTS_URL).mock(return_value=httpx.Response(200, text="<html>not json</html>"))
    page = respx.get(PROJECTS_URL, params={"c": "11"}).mock(return_value=httpx.Response(200, text=kwork_html))
    source = KworkSource(KworkConfig(categories=[11]), retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 12 and page.called


@respx.mock
async def test_fetch_fails_when_both_methods_fail():
    respx.post(PROJECTS_URL).mock(return_value=httpx.Response(403))
    respx.get(PROJECTS_URL).mock(return_value=httpx.Response(403))
    source = KworkSource(KworkConfig(categories=[11]), retries=0)
    try:
        with pytest.raises(Exception):
            await source.fetch()
    finally:
        await source.aclose()
