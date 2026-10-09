"""Freelancer.com: публичный API https://www.freelancer.com/api/projects/0.1/projects/active/.

Что известно (живые проверки сторонних проектов, август–октябрь 2026):
* для чтения активных проектов ключ и cookies не нужны, нужен браузерный User-Agent;
* ответ: {"status": "success", "result": {"projects": [...], "total_count": N}, "request_id": ...};
* query — свободный полнотекстовый поиск (слова через ИЛИ), поэтому окончательный отбор
  всё равно делают keywords.yaml;
* full_description=true — полный текст, job_details=true — навыки (jobs[].name);
* sort_field=submitdate — свежие сверху (так делает сам сайт);
* даты — unix-время (submitdate / time_submitted), бюджет — budget.minimum/maximum в валюте
  проекта, currency.exchange_rate — курс к доллару;
* ссылка: https://www.freelancer.com/projects/<seo_url>.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any

import httpx

from order_parser.config import FreelancerConfig
from order_parser.models import Order
from order_parser.sources import SOURCE_META
from order_parser.sources.base import HttpSource, SourceError

log = logging.getLogger(__name__)

API_URL = "https://www.freelancer.com/api/projects/0.1/projects/active/"
SITE_URL = "https://www.freelancer.com"
JSON_HEADERS = {"Accept": "application/json, text/plain, */*"}


def _amount(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _fmt(value: float) -> str:
    return f"{value:,.0f}" if value >= 10 else f"{value:g}"


def format_budget(project: dict[str, Any]) -> str:
    budget = project.get("budget") or {}
    low, high = _amount(budget.get("minimum")), _amount(budget.get("maximum"))
    if low is None and high is None:
        return ""
    currency = project.get("currency") or {}
    sign, code = currency.get("sign") or "", currency.get("code") or ""
    if low is not None and high is not None and high != low:
        text = f"{sign}{_fmt(low)}–{_fmt(high)}"
    elif low is not None and high is None:
        text = f"{sign}{_fmt(low)}+"
    else:
        text = f"{sign}{_fmt(high or low)}"  # type: ignore[arg-type]
    text = f"{text} {code}".strip()
    if project.get("type") == "hourly":
        text += " /час"
    return text


def project_to_order(project: dict[str, Any]) -> Order:
    project_id = str(project["id"])
    seo_url = (project.get("seo_url") or "").strip("/")
    description = (project.get("description") or project.get("preview_description") or "").strip()
    skills = [job.get("name") for job in project.get("jobs") or [] if isinstance(job, dict) and job.get("name")]
    if skills:
        description = f"{description}\n\nНавыки: {', '.join(skills)}".strip()

    currency = project.get("currency") or {}
    budget = project.get("budget") or {}
    upper = _amount(budget.get("maximum")) or _amount(budget.get("minimum"))
    value: float | None = None
    code = currency.get("code") or ""
    if upper is not None and project.get("type") != "hourly":
        rate = _amount(currency.get("exchange_rate"))
        value, code = (upper * rate, "USD") if rate else (upper, code)

    timestamp = project.get("submitdate") or project.get("time_submitted") or project.get("time_updated")
    return Order(
        source="freelancer",
        external_id=project_id,
        title=(project.get("title") or "").strip(),
        description=description,
        budget=format_budget(project),
        url=f"{SITE_URL}/projects/{seo_url}" if seo_url else f"{SITE_URL}/projects/{project_id}",
        published_at=datetime.fromtimestamp(int(timestamp), tz=timezone.utc) if timestamp else None,
        raw=project,
        budget_value=value,
        currency=code,
    )


def parse_response(payload: Any) -> list[Order]:
    if not isinstance(payload, dict):
        raise SourceError("Freelancer.com: ответ не JSON-объект")
    if payload.get("status") != "success":
        message = payload.get("message") or payload.get("error_code") or payload.get("error") or "неизвестная ошибка"
        raise SourceError(f"Freelancer.com: {message} (request_id={payload.get('request_id')})")
    projects = (payload.get("result") or {}).get("projects")
    if not isinstance(projects, list):
        raise SourceError("Freelancer.com: в ответе нет result.projects")
    return [project_to_order(p) for p in projects if isinstance(p, dict) and p.get("id")]


class FreelancerSource(HttpSource):
    name = "freelancer"
    emoji, title = SOURCE_META["freelancer"]

    def __init__(
        self, cfg: FreelancerConfig | None = None, keywords: Callable[[], list[str]] | None = None, **kwargs
    ) -> None:
        super().__init__(**kwargs)
        self.cfg = cfg or FreelancerConfig()
        self.keywords = keywords
        """Текущие include-слова (keywords.yaml); используются, если freelancer.queries пуст."""
        self._use_sort = True

    def queries(self) -> list[str | None]:
        if self.cfg.queries:
            return list(self.cfg.queries)
        # Заказы на Freelancer.com почти только на английском — ищем по латинским словам из keywords.yaml,
        # так новые слова из /add_kw сразу попадают и в поиск.
        words = [w.strip('"').strip() for w in (self.keywords() if self.keywords else [])]
        latin = [w for w in words if re.search(r"[a-z]", w, re.IGNORECASE) and not re.search(r"[а-яё]", w, re.IGNORECASE)]
        return list(dict.fromkeys(latin)) or [None]

    async def fetch(self) -> list[Order]:
        queries = self.queries()
        return await self.gather_pages(queries, self._fetch_query, pause=1.0, feed_key=lambda q: q or "*")

    def params(self, query: str | None) -> dict[str, str]:
        params = {
            "limit": str(self.cfg.limit),
            "full_description": "true",
            "job_details": "true",
            "compact": "true",
        }
        if self._use_sort:
            params["sort_field"] = "submitdate"
        if query:
            params["query"] = query
        return params

    async def _fetch_query(self, query: str | None) -> list[Order]:
        try:
            response = await self.get(API_URL, params=self.params(query), headers=JSON_HEADERS)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 400 and self._use_sort:
                # если API перестанет принимать sort_field — работаем без него (порядок не важен, есть дедупликация)
                log.warning("Freelancer.com отклонил sort_field=submitdate, запрашиваю без сортировки")
                self._use_sort = False
                response = await self.get(API_URL, params=self.params(query), headers=JSON_HEADERS)
            else:
                raise
        try:
            payload = response.json()
        except ValueError as exc:
            raise SourceError("Freelancer.com вернул не JSON (возможно, страница защиты)") from exc
        return parse_response(payload)
