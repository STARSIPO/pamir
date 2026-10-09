"""Общий интерфейс источников заказов."""

from __future__ import annotations

import abc
import asyncio
import logging
from collections.abc import Awaitable, Callable, Iterable
from typing import ClassVar, TypeVar

import httpx

from order_parser import http
from order_parser.models import Order

log = logging.getLogger(__name__)

T = TypeVar("T")


class SourceError(Exception):
    """Источник не смог отдать заказы (все запросы цикла завершились ошибкой)."""


class Source(abc.ABC):
    name: ClassVar[str]
    """Короткое имя (fl, kwork, ...): ключ в БД и флаг SOURCE_<NAME> в .env."""
    title: ClassVar[str]
    """Название для людей."""
    emoji: ClassVar[str]

    @abc.abstractmethod
    async def fetch(self) -> list[Order]:
        """Текущие заказы источника (новые сверху). Ошибки — исключением."""

    async def aclose(self) -> None:  # noqa: B027 — по умолчанию закрывать нечего
        pass


class HttpSource(Source):
    """Источник, который опрашивает сайт по HTTP."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        *,
        timeout: float = 20.0,
        retries: int = 3,
        user_agent: str = "",
        proxy: str = "",
    ) -> None:
        self._client = client
        self._own_client = client is None
        self.timeout = timeout
        self.retries = retries
        self.user_agent = user_agent
        self.proxy = proxy
        self.recorded: list[httpx.Response] | None = None
        """Если список — сюда складываются все ответы (для python -m order_parser.capture)."""

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = http.make_client(self.timeout, self.user_agent, proxy=self.proxy or None)
        return self._client

    async def get(self, url: str, **kwargs) -> httpx.Response:
        return await self._request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs) -> httpx.Response:
        return await self._request("POST", url, **kwargs)

    async def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        try:
            response = await http.request(self.client, method, url, retries=self.retries, **kwargs)
        except httpx.HTTPStatusError as exc:
            if self.recorded is not None:
                self.recorded.append(exc.response)
            raise
        if self.recorded is not None:
            self.recorded.append(response)
        return response

    async def aclose(self) -> None:
        if self._client is not None and self._own_client:
            await self._client.aclose()
            self._client = None

    async def gather_pages(
        self, items: Iterable[T], fetch_one: Callable[[T], Awaitable[list[Order]]], pause: float = 1.0
    ) -> list[Order]:
        """Обходит категории/запросы последовательно (бережно к сайту).

        Ошибка одной категории не теряет остальные; если не удалось ни одной — SourceError.
        Если сайт недоступен на уровне сети (DNS, соединение, прокси), остальные запросы
        цикла не делаются. Дубли (заказ в нескольких категориях) схлопываются.
        """
        orders: dict[str, Order] = {}
        errors: list[str] = []
        succeeded = 0
        items = list(items)
        for i, item in enumerate(items):
            if i:
                await asyncio.sleep(pause)
            try:
                page = await fetch_one(item)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{item}: {describe_error(exc)}" if len(items) > 1 else describe_error(exc))
                if len(items) > 1:
                    log.warning("%s: ошибка для %r: %s", self.title, item, describe_error(exc))
                if isinstance(exc, (httpx.ConnectError, httpx.ProxyError)):
                    if i + 1 < len(items):
                        errors.append(f"остальные запросы ({len(items) - i - 1}) пропущены: сайт недоступен")
                    break
                continue
            succeeded += 1
            for order in page:
                orders.setdefault(order.external_id, order)
        if errors and not succeeded:
            raise SourceError("; ".join(errors))
        return list(orders.values())


def describe_error(exc: BaseException) -> str:
    """Короткое понятное описание ошибки для логов и /sources."""
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        hint = {
            403: " — доступ запрещён (возможно, защита от ботов или блокировка IP)",
            404: " — адрес не найден (сайт мог поменять структуру)",
            429: " — слишком частые запросы, увеличьте POLL_INTERVAL",
        }.get(code, "")
        return f"HTTP {code} {exc.request.url}{hint}"
    if isinstance(exc, httpx.TimeoutException):
        return f"таймаут ({exc.__class__.__name__})"
    if isinstance(exc, httpx.TransportError):
        return f"сетевая ошибка: {exc.__class__.__name__}: {exc}"
    text = str(exc) or exc.__class__.__name__
    return text if isinstance(exc, SourceError) else f"{exc.__class__.__name__}: {text}"
