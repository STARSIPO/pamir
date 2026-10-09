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
    baseline: bool = False


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

    async def process(self, source: str, orders: list[Order], *, allow_baseline: bool = True) -> ProcessResult:
        result = ProcessResult(total=len(orders))
        if not orders:
            return result
        baseline = allow_baseline and self.use_baseline and not await self.db.is_initialized(source)
        result.baseline = baseline
        new_ids = await self.db.unseen_ids(source, [o.external_id for o in orders])
        to_send = []
        # Старые раньше новых — чтобы в Telegram заказы шли в хронологическом порядке.
        for order in sorted(orders, key=_chronological):
            if order.external_id not in new_ids:
                continue
            new_ids.discard(order.external_id)  # дубль внутри одной пачки
            result.new += 1
            if baseline:
                await self.db.add_seen(order, STATE_BASELINE, commit=False)
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
        if baseline:
            await self.db.mark_initialized(source)
            log.info("%s: первый запуск — %d текущих заказов помечены просмотренными без отправки",
                     source, result.new)
        for message in to_send:
            await self.notifier.enqueue(message)
        result.queued = len(to_send)
        return result
