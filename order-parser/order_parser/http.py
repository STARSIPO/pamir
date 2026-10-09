"""Общий HTTP-клиент для сайтов: реалистичные заголовки, таймауты, ретраи с backoff."""

from __future__ import annotations

import asyncio
import email.utils
import logging
import random
from datetime import datetime, timezone

import httpx

log = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
]

BROWSER_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
}

RETRY_STATUSES = frozenset({408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524})
MAX_RETRY_AFTER = 120.0


def make_client(timeout: float = 20.0, user_agent: str = "", **kwargs) -> httpx.AsyncClient:
    """Один клиент на источник: свой User-Agent и cookies на всю сессию, как у браузера."""
    headers = {"User-Agent": user_agent or random.choice(USER_AGENTS), **BROWSER_HEADERS}
    headers.update(kwargs.pop("headers", {}) or {})
    return httpx.AsyncClient(
        headers=headers,
        timeout=httpx.Timeout(timeout, connect=min(timeout, 10.0)),
        follow_redirects=True,
        limits=httpx.Limits(max_connections=4, max_keepalive_connections=2),
        **kwargs,
    )


def _retry_after_seconds(response: httpx.Response) -> float | None:
    value = response.headers.get("Retry-After")
    if not value:
        return None
    try:
        return min(float(value), MAX_RETRY_AFTER)
    except ValueError:
        pass
    try:
        when = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0.0, min((when - datetime.now(timezone.utc)).total_seconds(), MAX_RETRY_AFTER))


def backoff_delay(attempt: int, base: float = 2.0, cap: float = 60.0) -> float:
    """Экспоненциальная задержка с jitter ±20%: 2, 4, 8, ... секунд."""
    return min(cap, base * (2**attempt)) * random.uniform(0.8, 1.2)


async def request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    retries: int = 3,
    backoff_base: float = 2.0,
    **kwargs,
) -> httpx.Response:
    """Запрос с повторами на сетевых ошибках, 429 и 5xx. Остальные 4xx — сразу исключение."""
    attempt = 0
    while True:
        try:
            response = await client.request(method, url, **kwargs)
        except (httpx.TransportError, httpx.DecodingError) as exc:
            if attempt >= retries:
                raise
            delay = backoff_delay(attempt, backoff_base)
            log.warning("%s %s: %s — повтор через %.1f с", method, url, exc.__class__.__name__, delay)
        else:
            if response.status_code not in RETRY_STATUSES or attempt >= retries:
                response.raise_for_status()
                return response
            delay = _retry_after_seconds(response) or backoff_delay(attempt, backoff_base)
            log.warning("%s %s: HTTP %s — повтор через %.1f с", method, url, response.status_code, delay)
        attempt += 1
        await asyncio.sleep(delay)
