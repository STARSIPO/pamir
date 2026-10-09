"""Telegram: userbot на Telethon слушает новые сообщения в чатах/каналах из config.yaml."""

from __future__ import annotations

import asyncio
import contextlib
import getpass
import logging
import re
import signal
import sys
import threading
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from order_parser.models import Order
from order_parser.sources import SOURCE_META
from order_parser.sources.base import Source

log = logging.getLogger(__name__)

TITLE_LIMIT = 120

# Сначала «бюджет/цена/стоимость», потом «оплата» — в «Оплата: 50% предоплата» суммы нет.
_BUDGET_WORDS = (
    r"бюджет\w*|цен[аы]|стоимост\w*|гонорар\w*|вознагражден\w*|budget|price",
    r"оплат\w*|payment",
)
_AMOUNT = r"\d[\d\s.,]*\d|\d"
# множитель: 15к, 15k, 15 тыс., 100 тысяч, 5 т.р., 1.5 млн
_SCALE = r"(?:\s?(?:k|к|тыс\w*\.?|т\.\s?р\.?|млн\w*\.?)(?![а-яa-z]))"
# валюта; «тг» сюда не входит: в Telegram-чатах «10 ТГ каналов» — это Телеграм, а не тенге
_CURRENCY = (r"(?:₽|рубл\w*|руб\.?|р\.|\$|usd\w*|доллар\w*|бакс\w*|€|eur\w*|евро|грн|гривен\w*|₴|₸|тенге|"
             r"usdt|byn|kzt|uah)")
_MONEY = re.compile(
    rf"(?:(?:[$€£]\s?)?(?:{_AMOUNT}){_SCALE}?\s?(?:{_CURRENCY}\s?)?[-–—]\s?)?"  # начало диапазона «7 000 ₽ — »
    rf"(?:[$€£]\s?(?:{_AMOUNT}){_SCALE}?|(?:{_AMOUNT}){_SCALE}?\s?{_CURRENCY}|(?:{_AMOUNT}){_SCALE})",
    re.IGNORECASE,
)
_HAS_CURRENCY = re.compile(rf"{_CURRENCY}|[$€£]", re.IGNORECASE)
_BIG_NUMBER = re.compile(r"\d[\d\s]{2,}\d|\d{3,}")


def _budget_lines(text: str, words: str):
    pattern = re.compile(rf"(?<!\w)(?:{words})(?!\w)\s*[:：\-—–]?\s*([^\n]{{1,80}})", re.IGNORECASE)
    return (m.group(1) for m in pattern.finditer(text))


def extract_budget(text: str) -> str:
    """Ищет бюджет в свободном тексте объявления: «Бюджет: 10 000 ₽», «Оплата 300$», «цена 15к».

    В строке после «бюджет/цена/стоимость/оплата» берётся сумма (с валютой, «к/тыс» или число от 100).
    Вне такой строки суммой считается только число с валютой: «2к подписчиков» — не бюджет.
    «Договорная» без суммы — бюджет не указан.
    """
    negotiable = False
    for words in _BUDGET_WORDS:
        for value in _budget_lines(text, words):
            money = _MONEY.search(value)
            if money:
                return " ".join(money.group(0).split())
            number = _BIG_NUMBER.search(value)
            if number:
                return " ".join(number.group(0).split())
            negotiable = negotiable or bool(re.search(r"договор", value, re.IGNORECASE))
    for money in _MONEY.finditer(text):
        if _HAS_CURRENCY.search(money.group(0)):
            return " ".join(money.group(0).split())
    return "договорная" if negotiable else ""


def split_title(text: str) -> tuple[str, str]:
    """Первая строка — заголовок, если она короткая; иначе начало текста."""
    lines = [line.strip() for line in text.strip().splitlines()]
    lines = [line for line in lines if line]
    if not lines:
        return "", ""
    first = lines[0].strip("*_ #")
    if len(first) <= TITLE_LIMIT:
        return first, "\n".join(lines[1:])
    short = first if len(first) <= TITLE_LIMIT else first[:TITLE_LIMIT].rsplit(" ", 1)[0] + "…"
    return short, "\n".join(lines)


def chat_username(chat: Any) -> str | None:
    username = getattr(chat, "username", None)
    if username:
        return username
    for item in getattr(chat, "usernames", None) or []:
        if getattr(item, "active", True) and getattr(item, "username", None):
            return item.username
    return None


def message_link(chat: Any, message_id: int) -> str:
    username = chat_username(chat)
    if username:
        return f"https://t.me/{username}/{message_id}"
    # Каналы и супергруппы без username: ссылка работает для участников чата.
    if chat is not None and chat.__class__.__name__ == "Channel":
        return f"https://t.me/c/{chat.id}/{message_id}"
    return ""


def display_name(entity: Any) -> str:
    if entity is None:
        return ""
    username = chat_username(entity)
    if username:
        return f"@{username}"
    title = getattr(entity, "title", None)
    if title:
        return title
    parts = [getattr(entity, "first_name", None), getattr(entity, "last_name", None)]
    return " ".join(p for p in parts if p)


def message_to_order(message: Any, chat: Any, sender: Any = None) -> Order | None:
    text = (getattr(message, "message", None) or "").strip()
    if not text:
        return None
    chat_id = getattr(message, "chat_id", None) or getattr(chat, "id", 0)
    title, description = split_title(text)
    chat_title = getattr(chat, "title", None) or display_name(chat)
    same = sender is None or getattr(sender, "id", None) == getattr(chat, "id", None)
    author = "" if same else display_name(sender)
    return Order(
        source="telegram",
        external_id=f"{chat_id}:{message.id}",
        title=title,
        description=description,
        budget=extract_budget(text),
        url=message_link(chat, message.id),
        published_at=getattr(message, "date", None),
        raw={"chat_id": chat_id, "message_id": message.id, "chat": chat_title, "author": author},
    )


def normalize_chat_ref(ref: int | str) -> int | str:
    """Числа (в т.ч. строкой) → int. @name, t.me/name и ссылки-приглашения Telethon понимает сам."""
    if isinstance(ref, int):
        return ref
    value = str(ref).strip()
    return int(value) if re.fullmatch(r"-?\d+", value) else value


OrderHandler = Callable[[list[Order]], Awaitable[Any]]
StatusHandler = Callable[[str | None, int], Awaitable[Any]]


class TelegramAuthError(RuntimeError):
    """Сессия не авторизована или отозвана — нужен интерактивный вход (--login)."""


class _NoChats(RuntimeError):
    pass


def normalize_phone(phone: str) -> str:
    """«+7 (999) 123–45–67», «8 999 123 45 67» → «79991234567». Пусто, если номер не распознан."""
    digits = re.sub(r"\D", "", phone or "")
    if not (phone or "").strip().startswith("+") and len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]  # российский «8 999 ...» → «+7 999 ...» (но не «+81 ...» — это Япония)
    return digits if len(digits) >= 10 else ""


@contextlib.contextmanager
def interruptible_prompt():
    """Во время input() в работающем asyncio Ctrl+C должен сразу прерывать ввод."""
    if threading.current_thread() is not threading.main_thread():
        yield
        return
    previous = signal.getsignal(signal.SIGINT)
    signal.signal(signal.SIGINT, signal.default_int_handler)
    try:
        yield
    finally:
        signal.signal(signal.SIGINT, previous)


class TelegramSource(Source):
    """Основной режим — run(): слушает новые сообщения. fetch() — последние сообщения чатов
    (общий интерфейс источников; используется в режиме --once)."""

    name = "telegram"
    emoji, title = SOURCE_META["telegram"]
    fetch_limit = 20

    def __init__(
        self,
        api_id: int,
        api_hash: str,
        session_path: str | Path,
        chats: list[int | str],
        on_orders: OrderHandler,
        *,
        phone: str = "",
        on_status: StatusHandler | None = None,
    ) -> None:
        from telethon import TelegramClient

        Path(session_path).parent.mkdir(parents=True, exist_ok=True)
        self.session_file = Path(f"{session_path}.session")
        self.client = TelegramClient(
            str(session_path), api_id, api_hash,
            device_model="order-parser", system_version=sys.platform, app_version="1.0",
        )
        self.phone = phone
        self.chats = chats
        self.on_orders = on_orders
        self.on_status = on_status
        """on_status(None, chats) — всё работает; on_status("текст ошибки", 0) — ошибка."""
        self.chat_ids: list[int] = []

    async def _report(self, error: str | None) -> None:
        if self.on_status is not None:
            try:
                await self.on_status(error, 0 if error else len(self.chat_ids))
            except Exception:  # noqa: BLE001
                log.exception("Telegram: не удалось сохранить статус")

    async def login(self, interactive: bool = True) -> None:
        """Подключение. Первый раз спросит код из Telegram в консоли, потом сессия хранится в файле."""
        await self.client.connect()
        if await self.client.is_user_authorized():
            return
        if not interactive or not sys.stdin or not sys.stdin.isatty():
            raise TelegramAuthError(
                "Telegram-сессия не авторизована. Запустите один раз в консоли: run.bat --login (Windows) "
                "или ./run.sh --login (Linux)"
            )
        phone = normalize_phone(self.phone)
        if self.phone and not phone:
            print(f"TG_PHONE={self.phone!r} не похож на номер телефона — введите его вручную.")
        print("\n=== Вход в Telegram (userbot) — нужен один раз ===")
        try:
            with interruptible_prompt():
                await self.client.start(
                    phone=lambda: phone or input("Номер телефона (+7...): ").strip(),
                    code_callback=lambda: input("Код из Telegram: ").strip(),
                    password=lambda: getpass.getpass("Пароль двухэтапной проверки (2FA): "),
                )
        except EOFError as exc:
            raise TelegramAuthError("вход в Telegram отменён") from exc
        me = await self.client.get_me()
        print(f"Готово: вошли как {display_name(me)}. Сессия сохранена в {self.session_file}.\n")

    async def resolve_chats(self) -> tuple[list[int], list[str]]:
        from telethon import utils

        ids: list[int] = []
        errors: list[str] = []
        refs = [normalize_chat_ref(r) for r in self.chats]
        if any(isinstance(r, int) for r in refs):
            await self.client.get_dialogs()  # числовые id находятся только среди диалогов аккаунта
        for ref, original in zip(refs, self.chats):
            try:
                entity = await self.client.get_entity(ref)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{original}: {exc.__class__.__name__}: {exc}")
                log.warning("Telegram: не удалось найти чат %r — %s", original, exc)
                continue
            if getattr(entity, "left", False):
                log.warning(
                    "Telegram: вы не состоите в %s — новые сообщения оттуда не придут. Вступите в чат/канал.",
                    display_name(entity) or original,
                )
            ids.append(utils.get_peer_id(entity))
            log.info("Telegram: слушаю %s", display_name(entity) or original)
        return ids, errors

    async def fetch(self) -> list[Order]:
        """Последние fetch_limit сообщений каждого чата (нужно подключение: сначала login())."""
        if not self.chat_ids:
            self.chat_ids, errors = await self.resolve_chats()
            if not self.chat_ids:
                raise RuntimeError("нет доступных чатов" + (f": {'; '.join(errors)}" if errors else ""))
        orders: list[Order] = []
        for chat_id in self.chat_ids:
            async for message in self.client.iter_messages(chat_id, limit=self.fetch_limit):
                if getattr(message, "out", False):
                    continue
                order = message_to_order(message, await message.get_chat(), await message.get_sender())
                if order is not None:
                    orders.append(order)
        return orders

    async def _handle(self, event: Any) -> None:
        try:
            chat = await event.get_chat()
            sender = await event.get_sender()
            order = message_to_order(event.message, chat, sender)
            if order is not None:
                await self.on_orders([order])
        except Exception:  # noqa: BLE001
            log.exception("Telegram: ошибка обработки сообщения")

    async def run(self) -> None:
        """Слушает чаты, переподключается при сбоях. Любая ошибка остаётся внутри источника."""
        from telethon import events
        from telethon.errors import AuthKeyDuplicatedError, UnauthorizedError

        loop = asyncio.get_running_loop()
        delay = 5.0
        handler_added = False
        while True:
            started = loop.time()
            try:
                if not self.client.is_connected():
                    await self.client.connect()
                if not await self.client.is_user_authorized():
                    raise TelegramAuthError("сессия не авторизована — запустите с --login")
                if not self.chat_ids:
                    self.chat_ids, errors = await self.resolve_chats()
                    if not self.chat_ids:
                        detail = f" ({'; '.join(errors)})" if errors else ""
                        raise _NoChats(f"нет доступных чатов для прослушивания{detail}")
                    if errors:
                        await self._report("не найдены: " + "; ".join(errors))
                await self._report(None)  # подключены и слушаем — в том числе после переподключения
                if not handler_added:
                    # incoming=True: свои сообщения (например, ваши объявления в чатах) — не заказы
                    self.client.add_event_handler(self._handle, events.NewMessage(chats=self.chat_ids, incoming=True))
                    handler_added = True
                await self.client.run_until_disconnected()
            except asyncio.CancelledError:
                raise
            except (TelegramAuthError, UnauthorizedError, AuthKeyDuplicatedError) as exc:
                message = f"сессия недействительна ({exc.__class__.__name__}: {exc}) — выполните вход заново: --login"
                log.error("Telegram: %s", message)
                await self._report(message)
                return
            except _NoChats as exc:
                log.error("Telegram: %s, повторю через 10 минут", exc)
                await self._report(str(exc))
                delay = max(delay, 600.0)
            except Exception as exc:  # noqa: BLE001
                log.warning("Telegram: соединение потеряно (%s: %s)", exc.__class__.__name__, exc)
                await self._report(f"соединение потеряно: {exc.__class__.__name__}: {exc}")
            if loop.time() - started > 300:
                delay = 5.0
            await asyncio.sleep(delay)
            delay = min(delay * 2, 600.0)
            log.info("Telegram: переподключение...")

    async def aclose(self) -> None:
        if self.client.is_connected():
            await self.client.disconnect()
