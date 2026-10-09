"""Freelancer.com: разбор ответа API и параметры запроса."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
import pytest
import respx

from order_parser.config import FreelancerConfig
from order_parser.filters import KeywordStore, OrderFilter
from order_parser.sources.base import SourceError
from order_parser.sources.freelancer import API_URL, FreelancerSource, format_budget, parse_response


@pytest.fixture
def payload(fixtures) -> dict:
    return json.loads((fixtures / "freelancer" / "active_reconstructed_2026-08-29.json").read_text(encoding="utf-8"))


def test_parse_response(payload):
    orders = parse_response(payload)
    assert len(orders) == 5
    by_id = {o.external_id: o for o in orders}

    react = by_id["40675411"]
    assert react.source == "freelancer"
    assert react.title == "Fix React & Python Performance"
    assert react.budget == "$30–250 USD"
    assert react.budget_value == 250 and react.currency == "USD"
    assert react.url == "https://www.freelancer.com/projects/docker/Fix-React-Python-Performance"
    assert react.published_at == datetime(2026, 8, 29, 8, 38, 38, tzinfo=timezone.utc)
    assert "Навыки: JavaScript, Python, Django" in react.description

    inr = by_id["40678044"]
    assert inr.budget == "₹12,500–37,500 INR"
    assert inr.currency == "USD" and inr.budget_value == pytest.approx(37500 * 0.0114)

    hourly = by_id["40678412"]
    assert hourly.budget == "$15–25 USD /час"
    assert hourly.budget_value is None


def test_hourly_not_compared_with_min_budget(payload, tmp_path):
    orders = {o.external_id: o for o in parse_response(payload)}
    f = OrderFilter(KeywordStore(tmp_path / "k.yaml", include=[], exclude=[]), min_budget=10_000,
                    currency_rates={"RUB": 1, "USD": 90})
    assert f.check(orders["40678412"]).ok  # почасовая ставка — не отсекается по MIN_BUDGET
    assert f.check(orders["40675411"]).ok  # $250 ≈ 22 500 ₽
    assert not f.check(orders["40678438"]).ok  # ₹1 500 ≈ 1 500 ₽


@pytest.mark.parametrize(
    ("project", "text"),
    [
        ({"budget": {"minimum": 30, "maximum": 250}, "currency": {"sign": "$", "code": "USD"}, "type": "fixed"},
         "$30–250 USD"),
        ({"budget": {"minimum": 10}, "currency": {"sign": "€", "code": "EUR"}, "type": "hourly"}, "€10+ EUR /час"),
        ({"budget": {"minimum": 500, "maximum": 500}, "currency": {"sign": "$", "code": "USD"}}, "$500 USD"),
        ({"budget": {}, "currency": {"sign": "$", "code": "USD"}}, ""),
    ],
)
def test_format_budget(project, text):
    assert format_budget(project) == text


def test_error_envelope():
    with pytest.raises(SourceError, match="NOT_AUTHENTICATED"):
        parse_response({"status": "error", "error_code": "NOT_AUTHENTICATED", "request_id": "x"})
    with pytest.raises(SourceError):
        parse_response({"status": "success", "result": {}})


@respx.mock
async def test_fetch_params(payload):
    route = respx.get(API_URL).mock(return_value=httpx.Response(200, json=payload))
    source = FreelancerSource(FreelancerConfig(queries=["telegram bot"], limit=50), retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 5
    params = route.calls.last.request.url.params
    assert params["query"] == "telegram bot"
    assert params["limit"] == "50"
    assert params["full_description"] == "true" and params["job_details"] == "true"
    assert params["sort_field"] == "submitdate"
    assert "Mozilla/5.0" in route.calls.last.request.headers["User-Agent"]


@respx.mock
async def test_fetch_retries_without_sort_on_400(payload):
    route = respx.get(API_URL).mock(side_effect=[
        httpx.Response(400, json={"status": "error", "message": "bad sort"}),
        httpx.Response(200, json=payload),
    ])
    source = FreelancerSource(FreelancerConfig(queries=["react"]), retries=0)
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 5
    assert "sort_field" not in route.calls.last.request.url.params


@respx.mock
async def test_queries_deduplicated(payload):
    respx.get(API_URL).mock(return_value=httpx.Response(200, json=payload))
    source = FreelancerSource(FreelancerConfig(queries=["react", "python"]), retries=0)
    original = source.gather_pages

    async def no_pause(items, fetch_one, pause=0):
        return await original(items, fetch_one, pause=0)

    source.gather_pages = no_pause  # type: ignore[method-assign]
    try:
        orders = await source.fetch()
    finally:
        await source.aclose()
    assert len(orders) == 5
