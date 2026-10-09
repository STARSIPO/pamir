"""Поведение во время работы: первичная разметка по лентам, сбои Telegram, команды бота, полный цикл --once."""

from __future__ import annotations

import asyncio
import io
import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import httpx
import pytest
import respx
from aiogram import Bot, Dispatcher
from aiogram.client.session.base import BaseSession
from aiogram.exceptions import TelegramBadRequest, TelegramNetworkError
from aiogram.methods import SendMessage
from aiogram.types import Chat, Message, Update, User

from order_parser import main as app_main
from order_parser.bot.handlers import create_router
from order_parser.config import AppConfig, Settings
from order_parser.context import AppContext
from order_parser.db import STATE_QUEUED, utcnow
from order_parser.filters import KeywordStore, OrderFilter
from order_parser.models import Order
from order_parser.notifier import Notifier, format_order
from order_parser.processor import OrderProcessor
from order_parser.scheduler import Scheduler
from order_parser.sources.base import HttpSource
from order_parser.sources.telegram import TelegramSource


def make_order(i: int, title: str = "Нужен telegram бот") -> Order:
    return Order(source="fl", external_id=str(i), title=f"{title} #{i}", url=f"https://example.com/{i}")


@pytest.fixture
def processor(db, tmp_path):
    notifier = Notifier(db, dry_run=True, out=io.StringIO(), send_delay=0)
    return OrderProcessor(db, OrderFilter(KeywordStore(tmp_path / "k.yaml")), notifier)


# --- первичная разметка по лентам ------------------------------------------------


class FeedsSource(HttpSource):
    """Источник с несколькими лентами; feeds — {лента: заказы | исключение}."""

    name = "fl"
    title = "FL.ru"
    emoji = "🟢"

    def __init__(self, feeds):
        super().__init__()
        self.feeds = feeds

    async def fetch(self):
        async def one(key):
            value = self.feeds[key]
            if isinstance(value, Exception):
                raise value
            return list(value)

        return await self.gather_pages(list(self.feeds), one, pause=0)


async def test_failed_feed_on_first_poll_does_not_flood_later(db, processor):
    source = FeedsSource({"cat5": [make_order(1)], "cat31": RuntimeError("403")})
    scheduler = Scheduler([source], processor, db)
    result = (await scheduler.run_once())["fl"]
    assert result.baselined == 1 and result.queued == 0

    # следующий цикл: упавшая лента ожила и принесла свой «хвост» старых заказов
    source.feeds = {"cat5": [make_order(1), make_order(2)], "cat31": [make_order(10), make_order(11)]}
    result = (await scheduler.run_once())["fl"]
    assert result.baselined == 2  # хвост cat31 помечен без отправки
    assert result.queued == 1  # а действительно новый заказ из cat5 — отправлен
    assert processor.notifier.queue.get_nowait().external_id == "2"


async def test_feed_added_later_is_baselined(db, processor):
    source = FeedsSource({"cat5": [make_order(1)]})
    scheduler = Scheduler([source], processor, db)
    await scheduler.run_once()
    source.feeds = {"cat5": [make_order(1)], "sub279": [make_order(20), make_order(21)]}
    result = (await scheduler.run_once())["fl"]
    assert result.baselined == 2 and result.queued == 0


async def test_new_order_seen_in_old_and_new_feed_is_sent(db, processor):
    source = FeedsSource({"cat5": [make_order(1)]})
    scheduler = Scheduler([source], processor, db)
    await scheduler.run_once()
    source.feeds = {"cat5": [make_order(1), make_order(3)], "sub279": [make_order(3), make_order(30)]}
    result = (await scheduler.run_once())["fl"]
    assert result.queued == 1 and result.baselined == 1
    assert processor.notifier.queue.get_nowait().external_id == "3"


async def test_empty_but_successful_feed_is_initialized(db, processor):
    source = FeedsSource({"cat5": []})
    scheduler = Scheduler([source], processor, db)
    await scheduler.run_once()
    source.feeds = {"cat5": [make_order(7)]}
    result = (await scheduler.run_once())["fl"]
    assert result.queued == 1 and result.baselined == 0


async def test_network_error_skips_remaining_feeds(db, processor):
    calls = []

    class Down(FeedsSource):
        async def fetch(self):
            async def one(key):
                calls.append(key)
                raise httpx.ConnectError("down")

            return await self.gather_pages(["a", "b", "c"], one, pause=0)

    result = await Scheduler([Down({})], processor, db).run_once()
    assert result["fl"] is None and calls == ["a"]


# --- отправка при сбоях Telegram ----------------------------------------------------


class FlakyBot:
    def __init__(self, errors):
        self.errors = list(errors)
        self.sent = []

    async def send_message(self, chat_id, text, reply_markup=None, parse_mode=None):
        if self.errors:
            raise self.errors.pop(0)
        self.sent.append(text)


def _method():
    return SendMessage(chat_id=1, text="x")


@pytest.fixture
def no_sleep(monkeypatch):
    real_sleep = asyncio.sleep

    async def fast_sleep(delay, *args):
        await real_sleep(0)

    monkeypatch.setattr(asyncio, "sleep", fast_sleep)


async def test_outage_keeps_order_queued_and_retries(db, no_sleep):
    errors = [TelegramNetworkError(_method(), "down")] * 12
    bot = FlakyBot(errors)
    notifier = Notifier(db, bot=bot, admin_id=1, send_delay=0, max_attempts=3)
    await db.add_seen(make_order(1), STATE_QUEUED)
    worker = asyncio.create_task(notifier.run())
    await notifier.enqueue(format_order(make_order(1)))
    await asyncio.wait_for(notifier.drain(), 5)
    worker.cancel()
    assert len(bot.sent) == 1  # дождался восстановления связи и отправил
    assert (await db.stats(utcnow() - timedelta(hours=1)))["fl"].sent == 1


async def test_outage_in_once_mode_leaves_order_for_next_start(db, no_sleep):
    bot = FlakyBot([TelegramNetworkError(_method(), "down")] * 10)
    notifier = Notifier(db, bot=bot, admin_id=1, send_delay=0, max_attempts=3, retry_forever=False)
    message = format_order(make_order(1))
    await db.add_seen(make_order(1), STATE_QUEUED, payload=message.to_payload())
    worker = asyncio.create_task(notifier.run())
    await notifier.enqueue(message)
    await asyncio.wait_for(notifier.drain(), 5)
    worker.cancel()
    assert await db.pending(utcnow() - timedelta(hours=1))  # остался в очереди — дошлётся при запуске


async def test_chat_not_found_is_permanent(db):
    bot = FlakyBot([TelegramBadRequest(_method(), "Bad Request: chat not found")])
    notifier = Notifier(db, bot=bot, admin_id=1)
    assert await notifier.deliver(format_order(make_order(1))) is False
    assert not bot.errors  # без лишней повторной попытки простым текстом


# --- команды бота через настоящий Dispatcher ----------------------------------------


class RecordingSession(BaseSession):
    def __init__(self):
        super().__init__()
        self.requests = []

    async def make_request(self, bot, method, timeout=None):
        self.requests.append(method)
        if isinstance(method, SendMessage):
            return Message(message_id=len(self.requests), date=datetime.now(timezone.utc),
                           chat=Chat(id=method.chat_id, type="private"), text=method.text)
        return True

    async def stream_content(self, *args, **kwargs):  # pragma: no cover
        yield b""

    async def close(self):
        pass


def _update(user_id: int, text: str) -> Update:
    user = User(id=user_id, is_bot=False, first_name="U")
    message = Message(message_id=1, date=datetime.now(timezone.utc), chat=Chat(id=user_id, type="private"),
                      from_user=user, text=text)
    return Update(update_id=1, message=message)


@pytest.fixture
async def bot_env(db, tmp_path):
    session = RecordingSession()
    bot = Bot("123456:" + "A" * 35, session=session)
    keywords = KeywordStore.load(tmp_path / "keywords.yaml")
    notifier = Notifier(db, dry_run=True, out=io.StringIO())
    ctx = AppContext(settings=Settings(_env_file=None, admin_id=777), config=AppConfig(), db=db, keywords=keywords,
                     notifier=notifier, active_sources=["fl", "kwork"])
    dp = Dispatcher()
    dp.include_router(create_router(777))
    return SimpleNamespace(bot=bot, session=session, dp=dp, ctx=ctx, keywords=keywords)


async def _send(env, user_id: int, text: str) -> str:
    env.session.requests.clear()
    await env.dp.feed_update(env.bot, _update(user_id, text), ctx=env.ctx)
    return "\n".join(r.text for r in env.session.requests if isinstance(r, SendMessage))


async def test_admin_start_gets_help_not_stranger_text(bot_env):
    reply = await _send(bot_env, 777, "/start")
    assert "/pause" in reply and "Ваш Telegram ID" not in reply


async def test_stranger_start_gets_their_id(bot_env):
    reply = await _send(bot_env, 555, "/start")
    assert "<code>555</code>" in reply


async def test_stranger_cannot_use_admin_commands(bot_env):
    assert await _send(bot_env, 555, "/pause") == ""
    assert not bot_env.ctx.notifier.paused


async def test_pause_resume_kw_stats_sources(bot_env, db):
    assert "приостановлены" in await _send(bot_env, 777, "/pause")
    assert bot_env.ctx.notifier.paused
    assert "возобновлены" in await _send(bot_env, 777, "/resume")
    assert "Добавлено" in await _send(bot_env, 777, "/add_kw svelte, telegram mini app")
    assert "svelte" in bot_env.keywords.include.words
    assert "Удалено" in await _send(bot_env, 777, "/del_kw svelte")
    kw = await _send(bot_env, 777, "/kw")
    assert "telegram mini app" in kw and "ищу работу" in kw
    await db.add_seen(make_order(1), STATE_QUEUED)
    stats = await _send(bot_env, 777, "/stats")
    assert "FL.ru: найдено 1 · подходящих 1 · отправлено 0" in stats
    await db.record_error("kwork", "HTTP 403 <html>")
    sources = await _send(bot_env, 777, "/sources")
    assert "HTTP 403 &lt;html&gt;" in sources and "Kwork" in sources


# --- Telegram-источник не падает от сетевых ошибок --------------------------------


class FakeClient:
    def __init__(self, failures):
        self.failures = list(failures)
        self.handlers = []
        self.connected = False
        self.dialog_calls = 0

    def is_connected(self):
        return self.connected

    async def connect(self):
        self.connected = True

    async def is_user_authorized(self):
        return True

    async def get_dialogs(self):
        self.dialog_calls += 1
        if self.failures:
            raise self.failures.pop(0)

    async def get_entity(self, ref):
        from telethon.tl.types import Channel

        return Channel(id=1234567890, title="Заказы", photo=None, date=None, username="orders")

    def add_event_handler(self, handler, event):
        self.handlers.append(event)

    async def run_until_disconnected(self):
        raise asyncio.CancelledError  # завершаем тест после успешного подключения

    async def disconnect(self):
        self.connected = False


async def test_telegram_run_survives_startup_errors(tmp_path, no_sleep):
    statuses = []

    async def on_status(error, chats):
        statuses.append((error, chats))

    source = TelegramSource(1, "hash", tmp_path / "s", [-1001234567890], on_orders=lambda o: None,
                            on_status=on_status)
    source.client = FakeClient([ConnectionError("network down")])
    with pytest.raises(asyncio.CancelledError):
        await source.run()
    assert source.client.dialog_calls == 2  # первая попытка упала, вторая прошла
    assert statuses[0][0].startswith("соединение потеряно") and statuses[-1] == (None, 1)
    event = source.client.handlers[0]
    assert event.incoming is True  # свои исходящие сообщения не считаются заказами


# --- полный цикл --dry-run --once с подменёнными сайтами --------------------------


@respx.mock
async def test_dry_run_once_end_to_end(tmp_path, fixtures, capsys, monkeypatch):
    from order_parser.sources import fl, freelancer, kwork

    respx.get(fl.FEED_URL).mock(return_value=httpx.Response(
        200, content=(fixtures / "fl" / "rss_all_2026-06-17.xml").read_bytes()))
    respx.post(kwork.PROJECTS_URL).mock(return_value=httpx.Response(
        200, json=json.loads((fixtures / "kwork" / "projects_c11_2026-06-18.json").read_text(encoding="utf-8"))))
    respx.get(freelancer.API_URL).mock(return_value=httpx.Response(
        200, json=json.loads((fixtures / "freelancer" / "active_reconstructed_2026-08-29.json").read_text(encoding="utf-8"))))
    env = tmp_path / ".env"
    env.write_text(f"LOGS_DIR={tmp_path / 'logs'}\nDB_PATH={tmp_path / 'data' / 'orders.db'}\n"
                   "SOURCE_HABR=false\nSOURCE_TELEGRAM=false\n", encoding="utf-8")
    cfg = tmp_path / "config.yaml"
    cfg.write_text("freelancer:\n  queries: [react]\n", encoding="utf-8")
    monkeypatch.setattr(HttpSource, "gather_pages", _no_pause(HttpSource.gather_pages))

    args = app_main.parse_args(["--dry-run", "--once", "--env", str(env), "--config", str(cfg),
                                "--keywords", str(tmp_path / "keywords.yaml")])
    code = await app_main.run(args)
    out = capsys.readouterr().out
    assert code == 0, out
    assert "🟢 FL.ru: получено 60" in out
    assert "🟠 Kwork: получено 4" in out
    assert "🌐 Freelancer.com: получено 5" in out
    assert "Fix React & Python Performance" in out  # подходящий заказ напечатан
    assert "Открыть" not in out and "🔗 https://www.freelancer.com/projects/docker/Fix-React-Python-Performance" in out


def _no_pause(original):
    async def wrapper(self, items, fetch_one, pause=0, **kwargs):
        return await original(self, items, fetch_one, 0, **kwargs)

    return wrapper


async def test_broken_keywords_file_exits_cleanly(tmp_path):
    env = tmp_path / ".env"
    env.write_text(f"LOGS_DIR={tmp_path / 'logs'}\n", encoding="utf-8")
    kw = tmp_path / "keywords.yaml"
    kw.write_text("include: [unclosed\n", encoding="utf-8")
    args = app_main.parse_args(["--dry-run", "--once", "--env", str(env), "--keywords", str(kw)])
    assert await asyncio.wait_for(app_main.run(args), 5) == 2


async def test_supervised_swallows_errors():
    async def boom():
        raise RuntimeError("x")

    await app_main.supervised("test", boom())


async def test_telegram_fetch_reads_recent_messages(tmp_path):
    from telethon.tl.types import Channel

    chat = Channel(id=1234567890, title="Заказы", photo=None, date=None, username="orders")

    class Msg(SimpleNamespace):
        async def get_chat(self):
            return chat

        async def get_sender(self):
            return SimpleNamespace(id=5, username="client")

    class Client(FakeClient):
        async def iter_messages(self, chat_id, limit):
            for i, (text, out) in enumerate([("Нужен бот\nБюджет 5000 руб", False), ("Моё объявление", True)]):
                yield Msg(id=i + 1, message=text, out=out, chat_id=-1001234567890,
                          date=datetime(2026, 10, 1, tzinfo=timezone.utc))

    source = TelegramSource(1, "hash", tmp_path / "s", ["@orders"], on_orders=lambda o: None)
    source.client = Client([])
    orders = await source.fetch()
    assert [o.title for o in orders] == ["Нужен бот"]
    assert orders[0].budget == "5000 руб" and orders[0].url == "https://t.me/orders/1"


async def test_send_delay_between_any_two_messages(db, monkeypatch):
    sleeps = []
    real_sleep = asyncio.sleep

    async def record(delay, *args):
        sleeps.append(delay)
        await real_sleep(0)

    monkeypatch.setattr(asyncio, "sleep", record)
    notifier = Notifier(db, dry_run=True, out=io.StringIO(), send_delay=1.5)
    worker = asyncio.create_task(notifier.run())
    await notifier.enqueue(format_order(make_order(1)))
    await notifier.drain()  # очередь опустела...
    await notifier.enqueue(format_order(make_order(2)))  # ...и сразу пришёл следующий заказ
    await notifier.drain()
    worker.cancel()
    assert any(1.0 < d <= 1.5 for d in sleeps), sleeps


async def test_telegram_success_reported_after_reconnect(tmp_path, no_sleep):
    statuses = []

    async def on_status(error, chats):
        statuses.append((error, chats))

    class Reconnecting(FakeClient):
        def __init__(self):
            super().__init__([])
            self.runs = 0

        async def run_until_disconnected(self):
            self.runs += 1
            if self.runs == 1:
                raise ConnectionError("lost")
            raise asyncio.CancelledError

    source = TelegramSource(1, "hash", tmp_path / "s", ["@orders"], on_orders=lambda o: None, on_status=on_status)
    source.client = Reconnecting()
    with pytest.raises(asyncio.CancelledError):
        await source.run()
    assert statuses[-1] == (None, 1)  # после переподключения статус снова «работает»
    assert len(source.client.handlers) == 1  # обработчик не дублируется


async def test_first_login_prompt_until_success(db, tmp_path, monkeypatch):
    calls = []

    async def fake_login(self, interactive=True):
        calls.append(interactive)
        if len(calls) == 1:
            from order_parser.sources.telegram import TelegramAuthError

            raise TelegramAuthError("код введён неверно")

    monkeypatch.setattr(TelegramSource, "login", fake_login)
    settings = Settings(_env_file=None, tg_api_id=1, tg_api_hash="h", tg_session=str(tmp_path / "s"))
    config = AppConfig.model_validate({"telegram": {"chats": ["@orders"]}})
    assert await app_main.prepare_telegram(settings, config, None, db) is None
    for _ in range(2):
        source = await app_main.prepare_telegram(settings, config, None, db)
        assert source is not None
        await source.aclose()
    assert calls == [True, True, False]  # пока вход не удался — спрашиваем код; после успеха — нет


def test_instance_lock(tmp_path):
    from order_parser.lock import InstanceLock

    first, second = InstanceLock(tmp_path / "x.lock"), InstanceLock(tmp_path / "x.lock")
    assert first.acquire()
    assert not second.acquire()  # второй экземпляр не запустится
    first.release()
    assert second.acquire()
    second.release()


async def test_second_instance_refused(tmp_path):
    from order_parser.lock import InstanceLock

    env = tmp_path / ".env"
    env.write_text(f"LOGS_DIR={tmp_path / 'logs'}\nDB_PATH={tmp_path / 'orders.db'}\n", encoding="utf-8")
    held = InstanceLock(tmp_path / "order_parser.lock")
    assert held.acquire()
    try:
        args = app_main.parse_args(["--dry-run", "--env", str(env), "--keywords", str(tmp_path / "k.yaml")])
        assert await asyncio.wait_for(app_main.run(args), 5) == 2
    finally:
        held.release()
