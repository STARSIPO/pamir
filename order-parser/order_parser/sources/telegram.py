"""Telegram: userbot на Telethon слушает новые сообщения в чатах/каналах из config.yaml."""

from __future__ import annotations

import asyncio
import getpass
import logging
import re
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from order_parser.models import Order
from order_parser.sources import SOURCE_META

log = logging.getLogger(__name__)

TITLE_LIMIT = 120

_BUDGET_LINE = re.compile(
    r"(?<!\w)(?:бюджет\w*|оплат\w*|цен[аы]|стоимост\w*|гонорар\w*|вознагражден\w*|budget|price|payment)"
    r"(?!\w)\s*[:：\-—–]?\s*([^\n]{1,80})",
    re.IGNORECASE,
)
_MONEY = re.compile(
    r"(?:[$€£]\s?\d[\d\s.,]*(?:\s?(?:k|к|тыс\.?))?"
    r"|\d[\d\s.,]*(?:\s?(?:k|к|тыс\.?))?\s?(?:₽|руб\.?|рублей|р\.|\$|usd|€|eur|грн|₴|тг|₸|usdt))",
    re.IGNORECASE,
)


def extract_budget(text: str) -> str:
    """Ищет бюджет в свободном тексте объявления: «Бюджет: 10 000 ₽», «Оплата 300$»."""
    for match in _BUDGET_LINE.finditer(text):
        value = match.group(1).strip(" .,;:-—–*_")
        if re.search(r"\d|договор", value, re.IGNORECASE):
            return value[:60]
    money = _MONEY.search(text)
    return " ".join(money.group(0).split()) if money else ""


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


class TelegramSource:
    name = "telegram"
    emoji, title = SOURCE_META["telegram"]

    def __init__(
        self,
        api_id: int,
        api_hash: str,
        session_path: str | Path,
        chats: list[int | str],
        on_orders: OrderHandler,
        *,
        phone: str = "",
        on_status: Callable[[str | None, int], Awaitable[Any]] | None = None,
    ) -> None:
        from telethon import TelegramClient

        Path(session_path).parent.mkdir(parents=True, exist_ok=True)
        self.client = TelegramClient(
            str(session_path), api_id, api_hash,
            device_model="order-parser", system_version=sys.platform, app_version="1.0",
        )
        self.phone = phone
        self.chats = chats
        self.on_orders = on_orders
        self.on_status = on_status
        self.chat_ids: list[int] = []

    async def login(self, interactive: bool = True) -> None:
        """Подключение. Первый раз спросит код из Telegram в консоли, потом сессия хранится в файле."""
        await self.client.connect()
        if await self.client.is_user_authorized():
            return
        if not interactive or not sys.stdin or not sys.stdin.isatty():
            raise RuntimeError(
                "Telegram-сессия не авторизована. Запустите один раз в консоли: python -m order_parser --login"
            )
        print("\n=== Вход в Telegram (userbot) — нужен один раз ===")
        await self.client.start(
            phone=lambda: self.phone or input("Номер телефона (+7...): ").strip(),
            code_callback=lambda: input("Код из Telegram: ").strip(),
            password=lambda: getpass.getpass("Пароль двухэтапной проверки (2FA): "),
        )
        me = await self.client.get_me()
        print(f"Готово: вошли как {display_name(me)}. Сессия сохранена.\n")

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

    async def _handle(self, event: Any) -> None:
        try:
            chat = await event.get_chat()
            sender = await event.get_sender()
            order = message_to_order(event.message, chat, sender)
            if order is not None:
                await self.on_orders([order])
                if self.on_status:
                    await self.on_status(None, len(self.chat_ids))
        except Exception:  # noqa: BLE001
            log.exception("Telegram: ошибка обработки сообщения")

    async def run(self) -> None:
        from telethon import events

        if not self.client.is_connected():
            await self.login(interactive=False)
        self.chat_ids, errors = await self.resolve_chats()
        if not self.chat_ids:
            message = "нет доступных чатов для прослушивания" + (f" ({'; '.join(errors)})" if errors else "")
            if self.on_status:
                await self.on_status(message, 0)
            log.error("Telegram: %s", message)
            return
        if self.on_status:
            await self.on_status("; ".join(errors) if errors else None, len(self.chat_ids))
        self.client.add_event_handler(self._handle, events.NewMessage(chats=self.chat_ids))
        delay = 5
        while True:
            started = asyncio.get_running_loop().time()
            try:
                if not self.client.is_connected():
                    await self.client.connect()
                await self.client.run_until_disconnected()
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                log.warning("Telegram: соединение потеряно (%s)", exc)
                if self.on_status:
                    await self.on_status(f"соединение потеряно: {exc}", len(self.chat_ids))
            if asyncio.get_running_loop().time() - started > 300:
                delay = 5
            await asyncio.sleep(delay)
            delay = min(delay * 2, 300)
            log.info("Telegram: переподключение...")

    async def aclose(self) -> None:
        if self.client.is_connected():
            await self.client.disconnect()
