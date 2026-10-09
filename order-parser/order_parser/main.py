"""Точка входа: планировщик сайтов + Telethon + aiogram polling в одном asyncio-процессе."""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import logging
import signal
import sys
from datetime import timedelta
from logging.handlers import RotatingFileHandler

from order_parser import __version__
from order_parser.config import AppConfig, Settings, load_app_config, load_settings, resolve_path
from order_parser.context import AppContext
from order_parser.db import Database, utcnow
from order_parser.filters import KeywordStore, OrderFilter
from order_parser.notifier import Notifier, OutMessage
from order_parser.processor import OrderProcessor
from order_parser.scheduler import Scheduler
from order_parser.sources import SITE_SOURCES, SOURCE_META, build_site_sources

log = logging.getLogger("order_parser")

PENDING_WINDOW = timedelta(hours=24)


def setup_logging(level: str, logs_dir: str) -> None:
    for stream in (sys.stdout, sys.stderr):
        with contextlib.suppress(AttributeError, ValueError):
            stream.reconfigure(errors="replace")  # type: ignore[union-attr]
    directory = resolve_path(logs_dir)
    directory.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S")
    file_handler = RotatingFileHandler(directory / "order_parser.log", maxBytes=5 * 1024 * 1024, backupCount=5,
                                       encoding="utf-8")
    file_handler.setFormatter(fmt)
    console = logging.StreamHandler(sys.stderr)
    console.setFormatter(logging.Formatter("%(asctime)s %(levelname)-7s %(message)s", "%H:%M:%S"))
    root = logging.getLogger()
    root.handlers[:] = [file_handler, console]
    root.setLevel(level.upper())
    for noisy in ("httpx", "httpcore", "telethon", "aiogram.event", "aiosqlite", "asyncio"):
        logging.getLogger(noisy).setLevel(max(logging.WARNING, root.level))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m order_parser",
        description="Парсер заказов для фрилансера с уведомлениями в Telegram.",
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="печатать подходящие заказы в консоль вместо отправки в Telegram "
                             "(база в памяти, первый цикл показывает текущие заказы)")
    parser.add_argument("--once", action="store_true", help="один цикл опроса сайтов и выход")
    parser.add_argument("--login", action="store_true", help="только вход в Telegram-аккаунт (Telethon) и выход")
    parser.add_argument("--sources", help=f"какие источники запустить, через запятую: {','.join(SOURCE_META)} "
                                          "(по умолчанию — включённые в .env)")
    parser.add_argument("--env", help="путь к .env (по умолчанию .env в папке проекта)")
    parser.add_argument("--config", help="путь к config.yaml")
    parser.add_argument("--keywords", help="путь к keywords.yaml")
    parser.add_argument("--log-level", help="DEBUG, INFO, WARNING...")
    parser.add_argument("--version", action="version", version=f"order-parser {__version__}")
    return parser.parse_args(argv)


def selected_sources(args: argparse.Namespace, settings: Settings) -> tuple[set[str] | None, bool]:
    """Возвращает (сайты из --sources или None, нужен ли Telegram)."""
    if not args.sources:
        return None, settings.source_telegram
    names = {n.strip().lower() for n in args.sources.split(",") if n.strip()}
    unknown = names - set(SOURCE_META)
    if unknown:
        raise SystemExit(f"Неизвестные источники: {', '.join(sorted(unknown))}. Доступны: {', '.join(SOURCE_META)}")
    return names & set(SITE_SOURCES), "telegram" in names


def make_telegram_source(settings: Settings, config: AppConfig, processor: OrderProcessor | None, db: Database | None):
    from order_parser.sources.telegram import TelegramSource

    async def on_orders(orders):
        if processor is not None:
            await processor.process("telegram", orders, allow_baseline=False)

    async def on_status(error: str | None, chats: int) -> None:
        if db is None:
            return
        if error:
            await db.record_error("telegram", error)
        if chats:
            await db.record_success("telegram", chats)

    return TelegramSource(
        settings.tg_api_id, settings.tg_api_hash, resolve_path(settings.tg_session), config.telegram.chats,
        on_orders, phone=settings.tg_phone, on_status=on_status,
    )


async def login_only(settings: Settings, config: AppConfig) -> int:
    if not settings.telegram_configured:
        print("Заполните TG_API_ID и TG_API_HASH в .env (см. README: my.telegram.org)")
        return 2
    source = make_telegram_source(settings, config, None, None)
    try:
        await source.login(interactive=True)
        if config.telegram.chats:
            ids, errors = await source.resolve_chats()
            print(f"Чатов найдено: {len(ids)} из {len(config.telegram.chats)}")
            for error in errors:
                print(f"  ✗ {error}")
        else:
            print("В config.yaml пока нет чатов (telegram.chats).")
    finally:
        await source.aclose()
    return 0


async def check_bot(settings: Settings):
    from aiogram import Bot
    from aiogram.client.default import DefaultBotProperties
    from aiogram.enums import ParseMode

    bot = Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML,
                                                               link_preview_is_disabled=True))
    try:
        me = await bot.get_me()
    except Exception:
        await bot.session.close()
        raise
    log.info("Бот @%s готов, уведомления получает ADMIN_ID=%s", me.username, settings.admin_id)
    return bot


async def run(args: argparse.Namespace) -> int:
    settings = load_settings(args.env)
    setup_logging(args.log_level or settings.log_level, settings.logs_dir)
    config = load_app_config(args.config or settings.config_file)
    if args.login:
        return await login_only(settings, config)

    dry_run = args.dry_run
    if not dry_run and (not settings.bot_token or not settings.admin_id):
        log.error("Заполните BOT_TOKEN и ADMIN_ID в .env (или запустите с --dry-run для проверки в консоли)")
        return 2
    site_names, want_telegram = selected_sources(args, settings)
    if args.once:
        want_telegram = False

    bot = None
    if not dry_run:
        try:
            bot = await check_bot(settings)
        except Exception as exc:  # noqa: BLE001
            log.error("Не удалось подключиться к боту (проверьте BOT_TOKEN и доступ к api.telegram.org): %s", exc)
            return 2

    db = Database(":memory:" if dry_run else resolve_path(settings.db_path))
    await db.connect()
    keywords = KeywordStore.load(resolve_path(args.keywords or settings.keywords_file))
    order_filter = OrderFilter(keywords, settings.min_budget, settings.skip_no_budget,
                               config.filters.currency_rates)
    notifier = Notifier(db, bot=bot, admin_id=settings.admin_id, send_delay=0 if dry_run else settings.send_delay,
                        dry_run=dry_run)
    await notifier.restore_state()
    processor = OrderProcessor(db, order_filter, notifier, use_baseline=not dry_run)
    sources = build_site_sources(settings, config, site_names)
    scheduler = Scheduler(sources, processor, db, interval=settings.poll_interval, jitter=settings.poll_jitter)
    telegram = None
    try:
        if args.once:
            return await run_once(scheduler, notifier)

        if not dry_run:
            removed = await db.prune()
            if removed:
                log.info("Удалено старых записей: %d", removed)
            for source, external_id, payload in await db.pending(utcnow() - PENDING_WINDOW):
                await notifier.enqueue(OutMessage.from_payload(source, external_id, payload))
            if not notifier.queue.empty():
                log.info("Досылаю %d неотправленных заказов с прошлого запуска", notifier.queue.qsize())

        active = [s.name for s in sources]
        if want_telegram:
            telegram = await prepare_telegram(settings, config, processor, db)
            if telegram is not None:
                active.append("telegram")
        if dry_run:
            print("\n=== DRY-RUN: подходящие заказы печатаются здесь, в Telegram ничего не отправляется ===\n",
                  flush=True)
        ctx = AppContext(settings=settings, config=config, db=db, keywords=keywords, notifier=notifier,
                         active_sources=active)
        async with asyncio.TaskGroup() as group:
            group.create_task(notifier.run(), name="notifier")
            group.create_task(scheduler.run_forever(), name="scheduler")
            if telegram is not None:
                group.create_task(telegram.run(), name="telegram")
            if bot is not None:
                group.create_task(run_bot(bot, ctx), name="bot")
        return 0
    finally:
        for source in sources:
            with contextlib.suppress(Exception):
                await source.aclose()
        if telegram is not None:
            with contextlib.suppress(Exception):
                await telegram.aclose()
        if bot is not None:
            with contextlib.suppress(Exception):
                await bot.session.close()
        await db.close()


async def prepare_telegram(settings: Settings, config: AppConfig, processor: OrderProcessor, db: Database):
    reason = None
    if not settings.telegram_configured:
        reason = "не заданы TG_API_ID / TG_API_HASH в .env"
    elif not config.telegram.chats:
        reason = "в config.yaml не указаны чаты (telegram.chats)"
    if reason:
        log.warning("Telegram-источник пропущен: %s", reason)
        await db.record_error("telegram", reason)
        return None
    telegram = make_telegram_source(settings, config, processor, db)
    try:
        await telegram.login(interactive=True)
    except Exception as exc:  # noqa: BLE001 — без Telegram остальные источники продолжают работать
        log.error("Telegram-источник не запущен: %s", exc)
        await db.record_error("telegram", f"вход не выполнен: {exc}")
        with contextlib.suppress(Exception):
            await telegram.aclose()
        return None
    return telegram


async def run_bot(bot, ctx: AppContext) -> None:
    from aiogram import Dispatcher

    from order_parser.bot.handlers import COMMANDS, create_router

    dp = Dispatcher()
    dp.include_router(create_router(ctx.settings.admin_id))
    with contextlib.suppress(Exception):
        await bot.set_my_commands(COMMANDS)
    names = ", ".join(SOURCE_META[s][1] for s in ctx.active_sources) or "нет"
    with contextlib.suppress(Exception):
        await bot.send_message(ctx.settings.admin_id, f"✅ Парсер заказов запущен.\nИсточники: {names}"
                               + ("\n⏸ Уведомления на паузе (/resume)" if ctx.notifier.paused else ""))
    await dp.start_polling(bot, handle_signals=False, close_bot_session=False, ctx=ctx)


async def run_once(scheduler: Scheduler, notifier: Notifier) -> int:
    worker = asyncio.create_task(notifier.run())
    try:
        results = await scheduler.run_once()
        await notifier.drain()
    finally:
        worker.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await worker
    print("\nИтог цикла:")
    ok = 0
    for name, result in results.items():
        emoji, title = SOURCE_META[name]
        if result is None:
            print(f"  {emoji} {title}: ОШИБКА (см. лог выше)")
            continue
        ok += 1
        note = " — первый запуск: помечены просмотренными" if result.baseline else ""
        print(f"  {emoji} {title}: получено {result.total}, новых {result.new}, "
              f"подходящих {result.matched}, отправлено в очередь {result.queued}{note}")
    if not results:
        print("  Нет включённых сайтов")
    return 0 if ok == len(results) else 1


def cli(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    if sys.version_info < (3, 11):
        raise SystemExit("Нужен Python 3.11 или новее")

    async def main() -> int:
        task = asyncio.current_task()
        if task is not None and sys.platform != "win32":
            loop = asyncio.get_running_loop()
            with contextlib.suppress(NotImplementedError):
                loop.add_signal_handler(signal.SIGTERM, task.cancel)
        return await run(args)

    try:
        code = asyncio.run(main())
    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\nОстановлено.")
        code = 0
    sys.exit(code)
