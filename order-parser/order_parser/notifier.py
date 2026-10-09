"""Форматирование и отправка уведомлений: очередь, пауза между сообщениями, TelegramRetryAfter."""

from __future__ import annotations

import asyncio
import html
import logging
import sys
from dataclasses import dataclass
from typing import TYPE_CHECKING, TextIO

from aiogram.exceptions import (
    TelegramBadRequest,
    TelegramForbiddenError,
    TelegramNetworkError,
    TelegramRetryAfter,
    TelegramServerError,
)
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from order_parser.db import STATE_FAILED, STATE_SENT, Database
from order_parser.models import Order
from order_parser.sources import SOURCE_META

if TYPE_CHECKING:
    from aiogram import Bot

log = logging.getLogger(__name__)

DESCRIPTION_LIMIT = 600
TITLE_LIMIT = 250
BUTTON_TEXT = "Открыть заказ"


@dataclass(slots=True)
class OutMessage:
    source: str
    external_id: str
    html: str
    url: str
    plain: str

    def to_payload(self) -> dict[str, str]:
        return {"html": self.html, "url": self.url, "plain": self.plain}

    @classmethod
    def from_payload(cls, source: str, external_id: str, payload: dict) -> OutMessage:
        return cls(source, external_id, payload.get("html", ""), payload.get("url", ""), payload.get("plain", ""))


def truncate(text: str, limit: int) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    space = cut.rfind(" ")
    if space > limit * 0.7:
        cut = cut[:space]
    return cut.rstrip(" ,.;:-—\n") + "…"


def clean_text(text: str) -> str:
    """Схлопывает лишние пустые строки и пробелы."""
    lines = [" ".join(line.split()) for line in text.replace("\r", "").split("\n")]
    out: list[str] = []
    for line in lines:
        if line or (out and out[-1]):
            out.append(line)
    return "\n".join(out).strip()


def format_order(order: Order) -> OutMessage:
    emoji, source_title = SOURCE_META.get(order.source, ("📌", order.source))
    title = truncate(clean_text(order.title).replace("\n", " "), TITLE_LIMIT) or "Без названия"
    budget = clean_text(order.budget) or "не указан"
    description = truncate(clean_text(order.description), DESCRIPTION_LIMIT)
    where = source_title
    if isinstance(order.raw, dict):
        extra = [str(order.raw[k]) for k in ("chat", "author") if order.raw.get(k)]
        if extra:
            where = " · ".join([source_title, *extra])
    when = order.published_at.astimezone().strftime("%d.%m %H:%M") if order.published_at else ""
    meta = " · ".join(filter(None, [where, when]))

    parts = [f"{emoji} <b>{html.escape(title)}</b>", f"💰 {html.escape(budget)}", f"<i>{html.escape(meta)}</i>"]
    if description:
        parts += ["", html.escape(description)]
    html_text = "\n".join(parts)

    plain_parts = [f"{emoji} {title}", f"💰 {budget}", meta]
    if description:
        plain_parts += ["", description]
    if order.url:
        plain_parts += ["", f"🔗 {order.url}"]
    return OutMessage(order.source, order.external_id, html_text, order.url, "\n".join(plain_parts))


def _keyboard(url: str) -> InlineKeyboardMarkup | None:
    if not url.startswith(("https://", "http://", "tg://")):
        return None
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=BUTTON_TEXT, url=url)]])


class Notifier:
    """Очередь исходящих сообщений с одним отправителем — так проще соблюдать лимиты Telegram."""

    def __init__(
        self,
        db: Database,
        *,
        bot: Bot | None = None,
        admin_id: int = 0,
        send_delay: float = 1.5,
        dry_run: bool = False,
        out: TextIO | None = None,
        max_attempts: int = 5,
    ) -> None:
        if not dry_run and (bot is None or not admin_id):
            raise ValueError("Для отправки нужны bot и admin_id (или включите dry_run)")
        self.db = db
        self.bot = bot
        self.admin_id = admin_id
        self.send_delay = send_delay
        self.dry_run = dry_run
        self.out = out
        self.max_attempts = max_attempts
        self.queue: asyncio.Queue[OutMessage] = asyncio.Queue()
        self._running = asyncio.Event()
        self._running.set()

    # --- пауза --------------------------------------------------------------

    @property
    def paused(self) -> bool:
        return not self._running.is_set()

    async def set_paused(self, paused: bool) -> None:
        if paused:
            self._running.clear()
        else:
            self._running.set()
        await self.db.set_flag("paused", "1" if paused else "0")

    async def restore_state(self) -> None:
        if await self.db.get_flag("paused") == "1":
            self._running.clear()

    # --- очередь ------------------------------------------------------------

    async def enqueue(self, message: OutMessage) -> None:
        await self.queue.put(message)

    async def drain(self) -> None:
        """Ждёт, пока очередь опустеет (используется в режиме --once)."""
        await self.queue.join()

    async def run(self) -> None:
        while True:
            message = await self.queue.get()
            try:
                await self._running.wait()
                delivered = await self.deliver(message)
                await self.db.set_state(message.source, message.external_id, STATE_SENT if delivered else STATE_FAILED)
            except asyncio.CancelledError:
                raise
            except Exception:  # noqa: BLE001 — одна ошибка не должна останавливать очередь
                log.exception("Ошибка при отправке %s/%s", message.source, message.external_id)
            finally:
                self.queue.task_done()
            if self.send_delay and not self.queue.empty():
                await asyncio.sleep(self.send_delay)

    async def deliver(self, message: OutMessage) -> bool:
        if self.dry_run:
            out = self.out or sys.stdout
            print(message.plain, file=out)
            print("─" * 60, file=out, flush=True)
            return True
        assert self.bot is not None
        markup = _keyboard(message.url)
        text, parse_mode = message.html, "HTML"
        for attempt in range(self.max_attempts):
            try:
                await self.bot.send_message(self.admin_id, text, reply_markup=markup, parse_mode=parse_mode)
                return True
            except TelegramRetryAfter as exc:
                log.warning("Telegram просит подождать %s с (flood control)", exc.retry_after)
                await asyncio.sleep(exc.retry_after + 1)
            except TelegramForbiddenError:
                log.error(
                    "Бот не может написать ADMIN_ID=%s: откройте бота в Telegram и нажмите /start", self.admin_id
                )
                return False
            except TelegramBadRequest as exc:
                if markup is not None and "button" in str(exc).lower():
                    log.warning("Telegram отклонил кнопку (%s), отправляю ссылку текстом", exc)
                    markup = None
                    text = f"{text}\n\n{html.escape(message.url)}" if parse_mode else f"{text}\n\n{message.url}"
                elif parse_mode is not None:
                    log.warning("Telegram отклонил HTML (%s), отправляю простым текстом", exc)
                    text, parse_mode = message.plain, None
                else:
                    log.error("Не удалось отправить %s/%s: %s", message.source, message.external_id, exc)
                    return False
            except (TelegramNetworkError, TelegramServerError) as exc:
                delay = min(60, 2 ** (attempt + 1))
                log.warning("Ошибка связи с Telegram (%s), повтор через %s с", exc, delay)
                await asyncio.sleep(delay)
        log.error("Сообщение %s/%s не отправлено после %d попыток", message.source, message.external_id,
                  self.max_attempts)
        return False
