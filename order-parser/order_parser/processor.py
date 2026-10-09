"""Обработка пачки заказов: дедупликация → первичная разметка → фильтры → очередь отправки."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from order_parser.db import STATE_BASELINE, STATE_FILTERED, STATE_PAUSED, STATE_QUEUED, Database
from order_parser.filters import OrderFilter
from order_parser.models import Order
from order_parser.notifier import Notifier, format_order

log = logging.getLogger(__name__)

_FAR_FUTURE = datetime.max.replace(tzinfo=timezone.utc)


@dataclass(slots=True)
class ProcessResult:
    total: int = 0
    new: int = 0
    matched: int = 0
    queued: int = 0
    baselined: int = 0
    """Сколько заказов помечено просмотренными без отправки (первый запуск источника/ленты)."""

    @property
    def baseline(self) -> bool:
        return self.baselined > 0


def feed_state_key(source: str, feed: str) -> str:
    return f"{source}|{feed}"


def _chronological(order: Order) -> datetime:
    if order.published_at is None:
        return _FAR_FUTURE
    if order.published_at.tzinfo is None:
        return order.published_at.replace(tzinfo=timezone.utc)
    return order.published_at


class OrderProcessor:
    def __init__(self, db: Database, order_filter: OrderFilter, notifier: Notifier, *, use_baseline: bool = True):
        self.db = db
        self.filter = order_filter
        self.notifier = notifier
        self.use_baseline = use_baseline

    async def process(
        self, source: str, orders: list[Order], *, allow_baseline: bool = True, feeds: list[str] | None = None
    ) -> ProcessResult:
        """feeds — ленты, успешно прочитанные в этом цикле. Первичная разметка делается для каждой
        ленты отдельно: новая категория в config.yaml или лента, упавшая при первом опросе,
        не вывалит в Telegram свой «хвост» старых заказов."""
        result = ProcessResult(total=len(orders))
        if not orders and not feeds:
            return result
        fresh: set[str] = set()
        if allow_baseline and self.use_baseline:
            keys = [feed_state_key(source, f) for f in feeds] if feeds else [source]
            fresh = {k for k in keys if not await self.db.is_initialized(k)}

        def is_baseline(order: Order) -> bool:
            if not fresh:
                return False
            if not feeds:
                return source in fresh
            own = {feed_state_key(source, f) for f in order.feeds} or fresh
            return own <= fresh  # заказ есть хотя бы в одной «старой» ленте — значит, он действительно новый

        new_ids = await self.db.unseen_ids(source, [o.external_id for o in orders])
        to_send = []
        # Старые раньше новых — чтобы в Telegram заказы шли в хронологическом порядке.
        for order in sorted(orders, key=_chronological):
            if order.external_id not in new_ids:
                continue
            new_ids.discard(order.external_id)  # дубль внутри одной пачки
            result.new += 1
            if is_baseline(order):
                await self.db.add_seen(order, STATE_BASELINE, commit=False)
                result.baselined += 1
                continue
            check = self.filter.check(order)
            if not check.ok:
                await self.db.add_seen(order, STATE_FILTERED, reason=check.reason, commit=False)
                log.debug("%s/%s отклонён (%s): %s", source, order.external_id, check.reason, order.title)
                continue
            result.matched += 1
            reason = ", ".join(check.matched)
            if self.notifier.paused:
                await self.db.add_seen(order, STATE_PAUSED, reason=reason, commit=False)
                continue
            message = format_order(order)
            if await self.db.add_seen(order, STATE_QUEUED, reason=reason, payload=message.to_payload(), commit=False):
                to_send.append(message)
                log.info("%s: подходящий заказ «%s» (%s)", source, order.title, reason or "без фильтра слов")
        await self.db.commit()
        for key in sorted(fresh):
            await self.db.mark_initialized(key)
        if fresh:
            log.info("%s: первый опрос %s — %d текущих заказов помечены просмотренными без отправки",
                     source, ", ".join(k.split("|", 1)[-1] for k in sorted(fresh)), result.baselined)
        for message in to_send:
            await self.notifier.enqueue(message)
        result.queued = len(to_send)
        return result
