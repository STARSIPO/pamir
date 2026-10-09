"""Планировщик опроса сайтов: свой цикл на каждый источник, интервал с jitter, изоляция ошибок."""

from __future__ import annotations

import asyncio
import logging
import random

from order_parser.db import Database
from order_parser.processor import OrderProcessor, ProcessResult
from order_parser.sources.base import Source, describe_error

log = logging.getLogger(__name__)

MAX_ERROR_BACKOFF = 8  # при ошибках интервал растёт до x8


def jittered(interval: float, jitter: float) -> float:
    return interval * random.uniform(1 - jitter, 1 + jitter)


class Scheduler:
    def __init__(
        self,
        sources: list[Source],
        processor: OrderProcessor,
        db: Database,
        *,
        interval: float = 180,
        jitter: float = 0.2,
    ) -> None:
        self.sources = sources
        self.processor = processor
        self.db = db
        self.interval = interval
        self.jitter = jitter

    async def poll(self, source: Source) -> ProcessResult | None:
        """Один опрос источника. Любая ошибка логируется и сохраняется, но не пробрасывается."""
        try:
            orders = await source.fetch()
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            message = describe_error(exc)
            log.warning("%s: ошибка опроса — %s", source.title, message)
            log.debug("%s: подробности", source.title, exc_info=True)
            await self._record_error(source, message)
            return None
        try:
            result = await self.processor.process(source.name, orders, feeds=source.last_feeds)
            await self.db.record_success(source.name, len(orders))
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            log.exception("%s: ошибка обработки заказов", source.title)
            await self._record_error(source, f"обработка: {describe_error(exc)}")
            return None
        log.info("%s: получено %d, новых %d, подходящих %d%s", source.title, result.total, result.new,
                 result.matched, f", помечено без отправки (первый опрос) {result.baselined}" if result.baselined else "")
        return result

    async def _record_error(self, source: Source, message: str) -> None:
        try:
            await self.db.record_error(source.name, message)
        except Exception:  # noqa: BLE001
            log.exception("Не удалось сохранить ошибку источника %s", source.name)

    async def run_once(self) -> dict[str, ProcessResult | None]:
        """Один цикл по всем источникам (параллельно — это разные сайты)."""
        results = await asyncio.gather(*(self.poll(s) for s in self.sources))
        return {s.name: r for s, r in zip(self.sources, results)}

    async def run_forever(self) -> None:
        if not self.sources:
            log.info("Нет включённых сайтов для опроса")
            return
        log.info("Опрос сайтов: %s, интервал %d с ±%d%%",
                 ", ".join(s.title for s in self.sources), self.interval, round(self.jitter * 100))
        async with asyncio.TaskGroup() as group:
            for i, source in enumerate(self.sources):
                group.create_task(self._loop(source, start_delay=i * 3 + random.uniform(0, 2)),
                                  name=f"poll-{source.name}")

    async def _loop(self, source: Source, start_delay: float) -> None:
        await asyncio.sleep(start_delay)
        failures = 0
        while True:
            result = await self.poll(source)
            failures = 0 if result is not None else failures + 1
            factor = min(2**failures, MAX_ERROR_BACKOFF) if failures else 1
            delay = jittered(self.interval * factor, self.jitter)
            if failures:
                log.info("%s: следующая попытка через %.0f с (ошибок подряд: %d)", source.title, delay, failures)
            await asyncio.sleep(delay)
