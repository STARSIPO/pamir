"""Kwork: биржа проектов https://kwork.ru/projects.

Проверено по реальным ответам сайта (июнь–июль 2026):
* основной способ — POST https://kwork.ru/projects (form c=<категория>&page=N) с заголовком
  X-Requested-With: XMLHttpRequest → JSON {success, data: {pagination: {data: [...]}, wants: [...]}};
  авторизация, cookies и CSRF не нужны, 12 проектов на страницу, сортировка по date_active;
* запасной способ — GET https://kwork.ru/projects?c=<категория>: те же объекты лежат в
  window.stateData.wantsListData (страница отдаётся сервером, без JavaScript);
* даты (date_create, date_active) — московское время без часового пояса;
* при частых запросах Qrator отвечает 403 «Доступ заблокирован» (блок на всё, не только на JSON);
* бюджет: priceLimit — желаемый («1000.00», строка), possiblePriceLimit — допустимый максимум (число).
"""

from __future__ import annotations

import html
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from order_parser.config import KworkConfig
from order_parser.models import Order
from order_parser.sources import SOURCE_META
from order_parser.sources.base import HttpSource, SourceError

log = logging.getLogger(__name__)

BASE_URL = "https://kwork.ru"
PROJECTS_URL = f"{BASE_URL}/projects"
MSK = timezone(timedelta(hours=3), "MSK")  # без tzdata: в Москве UTC+3 круглый год с 2014 г.

XHR_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Origin": BASE_URL,
}

_STATE_RE = re.compile(r"window\.stateData\s*=\s*")
_TAG = re.compile(r"<[^>]+>")


class KworkFormatError(SourceError):
    """Ответ Kwork не похож на ожидаемый (не JSON, success=false, нет списка проектов)."""


def _number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _rub(value: float) -> str:
    return f"{value:,.0f}".replace(",", " ") + " ₽"


def format_budget(price: float | None, possible: float | None) -> str:
    if price is None and possible is None:
        return ""
    if price is None:
        return f"до {_rub(possible)}"  # type: ignore[arg-type]
    text = f"до {_rub(price)}"
    if possible is not None and possible > price:
        text += f" (допустимо до {_rub(possible)})"
    return text


def _text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    return _TAG.sub("", text).replace("\r\n", "\n").replace("\r", "\n").strip()


def _parse_msk(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%Y-%m-%d %H:%M:%S").replace(tzinfo=MSK)
    except ValueError:
        return None


def want_to_order(want: dict[str, Any]) -> Order:
    want_id = str(want["id"])
    price = _number(want.get("priceLimit"))
    possible = _number(want.get("possiblePriceLimit"))
    upper = max((v for v in (price, possible) if v is not None), default=None)
    return Order(
        source="kwork",
        external_id=want_id,
        title=_text(want.get("name")),
        description=_text(want.get("description")),
        budget=format_budget(price, possible),
        url=f"{PROJECTS_URL}/{want_id}/view",
        # date_active: перезапущенный старый проект всплывает наверх с новым date_active
        published_at=_parse_msk(want.get("date_active")) or _parse_msk(want.get("date_create")),
        raw=want,
        budget_value=upper,
        currency="RUB",
    )


def _first_list(*candidates: Any) -> list | None:
    for candidate in candidates:
        if isinstance(candidate, list):
            return candidate
    return None


def _items_to_orders(items: list) -> list[Order]:
    return [want_to_order(w) for w in items if isinstance(w, dict) and w.get("id")]


def parse_json(payload: Any) -> list[Order]:
    """Ответ POST /projects."""
    if not isinstance(payload, dict) or payload.get("success") is not True:
        raise KworkFormatError("Kwork: в ответе нет success=true")
    data = payload.get("data") or {}
    items = _first_list((data.get("pagination") or {}).get("data"), data.get("wants"))
    if items is None:
        raise KworkFormatError("Kwork: в JSON нет data.pagination.data / data.wants")
    return _items_to_orders(items)


def extract_state(page: str) -> dict[str, Any]:
    match = _STATE_RE.search(page)
    if not match:
        raise KworkFormatError("Kwork: на странице нет window.stateData")
    try:
        state, _ = json.JSONDecoder().raw_decode(page, match.end())
    except json.JSONDecodeError as exc:
        raise KworkFormatError(f"Kwork: не удалось разобрать window.stateData: {exc}") from exc
    if not isinstance(state, dict):
        raise KworkFormatError("Kwork: window.stateData не объект")
    return state


def parse_state_html(page: str) -> list[Order]:
    """HTML страницы /projects: проекты в window.stateData."""
    state = extract_state(page)
    listing = state.get("wantsListData") or {}
    items = _first_list(
        (listing.get("pagination") or {}).get("data"),
        listing.get("wants"),
        (state.get("pagination") or {}).get("data"),
        state.get("wants"),
    )
    if items is None:
        raise KworkFormatError("Kwork: в window.stateData нет списка проектов (wantsListData)")
    return _items_to_orders(items)


class KworkSource(HttpSource):
    name = "kwork"
    emoji, title = SOURCE_META["kwork"]

    def __init__(self, cfg: KworkConfig | None = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.cfg = cfg or KworkConfig()

    async def fetch(self) -> list[Order]:
        return await self.gather_pages(self.cfg.categories or ["all"], self._fetch_category, pause=2.0)

    async def _fetch_category(self, category: int | str) -> list[Order]:
        orders: list[Order] = []
        # во «всех категориях» 12 проектов — это всего 10–20 минут, читаем минимум 2 страницы
        pages = max(self.cfg.pages, 2) if str(category) == "all" else self.cfg.pages
        for page in range(1, pages + 1):
            page_orders = await self._fetch_page(category, page)
            orders.extend(page_orders)
            if len(page_orders) < 12:  # последняя страница
                break
        return orders

    async def _fetch_page(self, category: int | str, page: int) -> list[Order]:
        try:
            return await self._fetch_json(category, page)
        except (KworkFormatError, httpx.HTTPStatusError) as exc:
            # 403/429/5xx — блокировка или перегрузка: запасной запрос только усугубит, пусть сработает backoff
            if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code not in (400, 404, 405):
                raise
            log.info("Kwork: JSON-ответ недоступен (%s), читаю window.stateData со страницы", exc)
            return await self._fetch_html(category, page)

    async def _fetch_json(self, category: int | str, page: int) -> list[Order]:
        response = await self.post(
            PROJECTS_URL,
            data={"c": str(category), "page": str(page)},
            headers={**XHR_HEADERS, "Referer": f"{PROJECTS_URL}?c={category}"},
        )
        try:
            payload = response.json()
        except ValueError as exc:
            raise KworkFormatError("Kwork вернул не JSON") from exc
        return parse_json(payload)

    async def _fetch_html(self, category: int | str, page: int) -> list[Order]:
        params: dict[str, str] = {"c": str(category)}
        if page > 1:
            params["page"] = str(page)
        response = await self.get(PROJECTS_URL, params=params)
        return parse_state_html(response.text)
