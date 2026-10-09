"""БД, обработка пачек (дедупликация, первый запуск), очередь отправки, планировщик."""

from __future__ import annotations

import asyncio
import io
from datetime import datetime, timedelta, timezone

import pytest
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError, TelegramRetryAfter
from aiogram.methods import SendMessage

from order_parser.db import STATE_FAILED, STATE_PAUSED, STATE_QUEUED, STATE_SENT, utcnow
from order_parser.filters import KeywordStore, OrderFilter
from order_parser.models import Order
from order_parser.notifier import DESCRIPTION_LIMIT, Notifier, OutMessage, format_order, truncate
from order_parser.processor import OrderProcessor
from order_parser.scheduler import Scheduler
from order_parser.sources.base import Source


def make_order(i: int, title: str = "Нужен telegram бот", source: str = "fl", **kwargs) -> Order:
    return Order(source=source, external_id=str(i), title=f"{title} #{i}", url=f"https://example.com/{i}", **kwargs)


@pytest.fixture
def order_filter(tmp_path) -> OrderFilter:
    return OrderFilter(KeywordStore(tmp_path / "keywords.yaml"))


@pytest.fixture
def sink() -> io.StringIO:
    return io.StringIO()


@pytest.fixture
def notifier(db, sink) -> Notifier:
    return Notifier(db, dry_run=True, out=sink, send_delay=0)


# --- база -------------------------------------------------------------------


async def test_seen_unique(db):
    order = make_order(1)
    assert await db.add_seen(order, STATE_QUEUED)
    assert not await db.add_seen(order, STATE_QUEUED)
    assert await db.unseen_ids("fl", ["1", "2", "2"]) == {"2"}
    assert await db.add_seen(make_order(1, source="kwork"), STATE_QUEUED)  # другой источник — другой заказ


async def test_stats_and_states(db):
    await db.add_seen(make_order(1), "baseline")
    await db.add_seen(make_order(2), "filtered")
    await db.add_seen(make_order(3), STATE_QUEUED)
    await db.add_seen(make_order(4), STATE_PAUSED)
    await db.set_state("fl", "3", STATE_SENT)
    stats = await db.stats(utcnow() - timedelta(days=1))
    assert (stats["fl"].found, stats["fl"].matched, stats["fl"].sent) == (3, 2, 1)
    assert await db.count_state(STATE_PAUSED, utcnow() - timedelta(hours=1)) == 1


async def test_source_state(db):
    assert not await db.is_initialized("fl")
    await db.mark_initialized("fl")
    assert await db.is_initialized("fl")
    await db.record_error("fl", "HTTP 403")
    await db.record_success("fl", 60)
    state = (await db.source_states())["fl"]
    assert state.initialized and state.last_count == 60 and state.last_error == "HTTP 403"
    assert state.last_success >= state.last_error_at


async def test_pending_and_flags(db):
    message = format_order(make_order(1))
    await db.add_seen(make_order(1), STATE_QUEUED, payload=message.to_payload())
    pending = await db.pending(utcnow() - timedelta(hours=1))
    assert pending == [("fl", "1", message.to_payload())]
    assert await db.get_flag("paused") is None
    await db.set_flag("paused", "1")
    await db.set_flag("paused", "0")
    assert await db.get_flag("paused") == "0"


async def test_prune(db):
    await db.add_seen(make_order(1), STATE_SENT)
    await db.conn.execute("UPDATE seen SET first_seen = '2000-01-01T00:00:00+00:00'")
    assert await db.prune(90) == 1


# --- обработка --------------------------------------------------------------


async def test_first_run_is_baseline(db, order_filter, notifier):
    processor = OrderProcessor(db, order_filter, notifier)
    result = await processor.process("fl", [make_order(1), make_order(2)])
    assert result.baseline and result.new == 2 and result.queued == 0
    assert notifier.queue.empty()
    assert await db.is_initialized("fl")

    result = await processor.process("fl", [make_order(1), make_order(2), make_order(3)])
    assert not result.baseline and result.new == 1 and result.queued == 1
    assert notifier.queue.get_nowait().external_id == "3"


async def test_empty_first_fetch_does_not_initialize(db, order_filter, notifier):
    processor = OrderProcessor(db, order_filter, notifier)
    await processor.process("fl", [])
    assert not await db.is_initialized("fl")


async def test_filtering_and_chronological_order(db, order_filter, notifier):
    await db.mark_initialized("fl")
    processor = OrderProcessor(db, order_filter, notifier)
    t0 = datetime(2026, 6, 1, tzinfo=timezone.utc)
    orders = [
        make_order(3, published_at=t0 + timedelta(hours=2)),
        make_order(2, title="Логотип для кафе", published_at=t0 + timedelta(hours=1)),
        make_order(1, published_at=t0),
        make_order(1, published_at=t0),  # дубль внутри пачки
    ]
    result = await processor.process("fl", orders)
    assert (result.new, result.matched, result.queued) == (2 + 1, 2, 2)
    queued = [notifier.queue.get_nowait().external_id for _ in range(notifier.queue.qsize())]
    assert queued == ["1", "3"]  # старые раньше новых, неподходящий отфильтрован


async def test_paused_orders_not_queued(db, order_filter, notifier):
    await db.mark_initialized("fl")
    await notifier.set_paused(True)
    processor = OrderProcessor(db, order_filter, notifier)
    result = await processor.process("fl", [make_order(1)])
    assert result.matched == 1 and result.queued == 0
    assert await db.count_state(STATE_PAUSED, utcnow() - timedelta(minutes=1)) == 1


async def test_telegram_has_no_baseline(db, order_filter, notifier):
    processor = OrderProcessor(db, order_filter, notifier)
    result = await processor.process("telegram", [make_order(1, source="telegram")], allow_baseline=False)
    assert result.queued == 1


async def test_dry_run_processor_without_baseline(db, order_filter, notifier):
    processor = OrderProcessor(db, order_filter, notifier, use_baseline=False)
    result = await processor.process("fl", [make_order(1)])
    assert not result.baseline and result.queued == 1


# --- форматирование и отправка -----------------------------------------------


def test_format_order_html_escaped_and_truncated():
    order = Order(
        source="kwork", external_id="1", title="Бот <b>для</b> & магазина", description="слово " * 300,
        budget="до 5 000 ₽", url="https://kwork.ru/projects/1/view",
        published_at=datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
    )
    message = format_order(order)
    first_line = message.html.split("\n")[0]
    assert first_line == "🟠 <b>Бот &lt;b&gt;для&lt;/b&gt; &amp; магазина</b>"
    assert "💰 до 5 000 ₽" in message.html
    assert "<i>Kwork · " in message.html
    description = message.html.split("\n\n", 1)[1]
    assert len(description) <= DESCRIPTION_LIMIT + 1 and description.endswith("…")
    assert message.plain.endswith("🔗 https://kwork.ru/projects/1/view")


def test_format_order_without_budget_and_telegram_meta():
    order = Order(source="telegram", external_id="1:2", title="Нужен сайт", raw={"chat": "Фриланс чат", "author": "@ivan"})
    message = format_order(order)
    assert "💰 не указан" in message.html
    assert "Telegram · Фриланс чат · @ivan" in message.html


def test_truncate():
    assert truncate("коротко", 600) == "коротко"
    text = "a" * 590 + " bbbbbbbbbbbbbbbbbbbb"
    assert truncate(text, 600) == "a" * 590 + "…"


class FakeBot:
    def __init__(self, errors: list[Exception] | None = None):
        self.errors = list(errors or [])
        self.sent: list[dict] = []

    async def send_message(self, chat_id, text, reply_markup=None, parse_mode=None):
        if self.errors:
            raise self.errors.pop(0)
        self.sent.append({"chat_id": chat_id, "text": text, "markup": reply_markup, "parse_mode": parse_mode})


def _method():
    return SendMessage(chat_id=1, text="x")


async def test_deliver_with_keyboard(db):
    bot = FakeBot()
    notifier = Notifier(db, bot=bot, admin_id=42, send_delay=0)
    assert await notifier.deliver(format_order(make_order(1)))
    sent = bot.sent[0]
    assert sent["chat_id"] == 42 and sent["parse_mode"] == "HTML"
    button = sent["markup"].inline_keyboard[0][0]
    assert button.text == "Открыть заказ" and button.url == "https://example.com/1"


async def test_retry_after_is_respected(db, monkeypatch):
    sleeps: list[float] = []

    async def fake_sleep(delay):
        sleeps.append(delay)

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)
    bot = FakeBot([TelegramRetryAfter(_method(), "Flood control", 7)])
    notifier = Notifier(db, bot=bot, admin_id=42)
    assert await notifier.deliver(format_order(make_order(1)))
    assert sleeps == [8] and len(bot.sent) == 1


async def test_bad_button_falls_back_to_text_link(db):
    bot = FakeBot([TelegramBadRequest(_method(), "Bad Request: BUTTON_URL_INVALID")])
    notifier = Notifier(db, bot=bot, admin_id=42)
    assert await notifier.deliver(format_order(make_order(1)))
    assert bot.sent[0]["markup"] is None and "https://example.com/1" in bot.sent[0]["text"]


async def test_forbidden_gives_up(db):
    bot = FakeBot([TelegramForbiddenError(_method(), "Forbidden: bot was blocked by the user")])
    notifier = Notifier(db, bot=bot, admin_id=42)
    assert not await notifier.deliver(format_order(make_order(1)))


async def test_worker_marks_sent_and_respects_pause(db, sink):
    notifier = Notifier(db, dry_run=True, out=sink, send_delay=0)
    for i in (1, 2):
        message = format_order(make_order(i))
        await db.add_seen(make_order(i), STATE_QUEUED, payload=message.to_payload())
    worker = asyncio.create_task(notifier.run())
    await notifier.enqueue(OutMessage.from_payload("fl", "1", format_order(make_order(1)).to_payload()))
    await asyncio.wait_for(notifier.drain(), 2)
    assert "Нужен telegram бот #1" in sink.getvalue()

    await notifier.set_paused(True)
    await notifier.enqueue(format_order(make_order(2)))
    await asyncio.sleep(0.05)
    assert "#2" not in sink.getvalue()
    await notifier.set_paused(False)
    await asyncio.wait_for(notifier.drain(), 2)
    assert "#2" in sink.getvalue()
    worker.cancel()
    stats = await db.stats(utcnow() - timedelta(hours=1))
    assert stats["fl"].sent == 2


async def test_worker_marks_failed(db):
    bot = FakeBot([TelegramForbiddenError(_method(), "Forbidden")])
    notifier = Notifier(db, bot=bot, admin_id=42, send_delay=0)
    await db.add_seen(make_order(1), STATE_QUEUED)
    worker = asyncio.create_task(notifier.run())
    await notifier.enqueue(format_order(make_order(1)))
    await asyncio.wait_for(notifier.drain(), 2)
    worker.cancel()
    async with db.conn.execute("SELECT state FROM seen") as cur:
        assert (await cur.fetchone())["state"] == STATE_FAILED


def test_notifier_requires_bot_unless_dry_run(db):
    with pytest.raises(ValueError):
        Notifier(db)


# --- планировщик ------------------------------------------------------------


class GoodSource(Source):
    name = "fl"
    title = "FL.ru"
    emoji = "🟢"

    def __init__(self, orders):
        self.orders = orders

    async def fetch(self):
        return self.orders


class BrokenSource(Source):
    name = "kwork"
    title = "Kwork"
    emoji = "🟠"

    async def fetch(self):
        raise RuntimeError("сайт упал")


async def test_one_broken_source_does_not_stop_others(db, order_filter, notifier):
    processor = OrderProcessor(db, order_filter, notifier, use_baseline=False)
    scheduler = Scheduler([BrokenSource(), GoodSource([make_order(1)])], processor, db)
    results = await scheduler.run_once()
    assert results["kwork"] is None
    assert results["fl"].queued == 1
    states = await db.source_states()
    assert "сайт упал" in states["kwork"].last_error
    assert states["fl"].last_count == 1 and states["fl"].last_error is None
