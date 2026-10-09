"""Команды бота. Отвечает только ADMIN_ID; остальным подсказывает их Telegram ID."""

from __future__ import annotations

import html
import re
from datetime import datetime, timedelta

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import BotCommand, Message

from order_parser.context import AppContext
from order_parser.db import STATE_PAUSED, parse_ts, utcnow
from order_parser.sources import SOURCE_META

COMMANDS = [
    BotCommand(command="start", description="Приветствие и справка"),
    BotCommand(command="pause", description="Приостановить уведомления"),
    BotCommand(command="resume", description="Возобновить уведомления"),
    BotCommand(command="stats", description="Статистика за сутки"),
    BotCommand(command="sources", description="Статус источников"),
    BotCommand(command="kw", description="Ключевые слова"),
    BotCommand(command="add_kw", description="Добавить слова: /add_kw слово, фраза"),
    BotCommand(command="del_kw", description="Удалить слова: /del_kw слово"),
]

HELP = (
    "Я присылаю новые подходящие заказы с бирж и из Telegram-чатов.\n\n"
    "/pause — приостановить уведомления\n"
    "/resume — возобновить\n"
    "/stats — найдено/отправлено за сутки\n"
    "/sources — статус источников и последняя ошибка\n"
    "/kw — ключевые слова\n"
    "/add_kw <code>слово, фраза</code> — добавить в include\n"
    "/del_kw <code>слово</code> — удалить из include"
)

MESSAGE_LIMIT = 4000


def split_words(args: str | None) -> list[str]:
    if not args:
        return []
    return [w.strip() for w in re.split(r"[,;\n]+", args) if w.strip()]


def fmt_time(dt: datetime | None) -> str:
    if dt is None:
        return "—"
    delta = utcnow() - dt
    if delta < timedelta(minutes=1):
        ago = "только что"
    elif delta < timedelta(hours=1):
        ago = f"{int(delta.total_seconds() // 60)} мин назад"
    elif delta < timedelta(days=1):
        ago = f"{int(delta.total_seconds() // 3600)} ч назад"
    else:
        ago = f"{delta.days} дн назад"
    return f"{dt.astimezone().strftime('%d.%m %H:%M')} ({ago})"


def chunks(text: str, limit: int = MESSAGE_LIMIT) -> list[str]:
    parts: list[str] = []
    current = ""
    for line in text.split("\n"):
        if len(current) + len(line) + 1 > limit and current:
            parts.append(current)
            current = ""
        current = f"{current}\n{line}" if current else line
    if current:
        parts.append(current)
    return parts


def create_router(admin_id: int) -> Router:
    router = Router(name="order-parser")
    admin = Router(name="admin")
    admin.message.filter(F.from_user.id == admin_id)
    router.include_router(admin)

    @admin.message(CommandStart())
    @admin.message(Command("help"))
    async def cmd_start(message: Message, ctx: AppContext) -> None:
        state = "⏸ уведомления на паузе (/resume)" if ctx.notifier.paused else "▶️ уведомления включены"
        sources = ", ".join(SOURCE_META[s][1] for s in ctx.active_sources if s in SOURCE_META) or "нет"
        await message.answer(f"👋 Привет! {HELP}\n\nСейчас: {state}\nИсточники: {html.escape(sources)}")

    @admin.message(Command("pause"))
    async def cmd_pause(message: Message, ctx: AppContext) -> None:
        if ctx.notifier.paused:
            await message.answer("Уже на паузе. /resume — возобновить.")
            return
        await ctx.notifier.set_paused(True)
        await ctx.db.set_flag("paused_at", utcnow().isoformat(timespec="seconds"))
        await message.answer("⏸ Уведомления приостановлены. Заказы продолжают собираться, "
                             "но не отправляются. /resume — возобновить.")

    @admin.message(Command("resume"))
    async def cmd_resume(message: Message, ctx: AppContext) -> None:
        if not ctx.notifier.paused:
            await message.answer("Уведомления и так включены.")
            return
        await ctx.notifier.set_paused(False)
        paused_at = parse_ts(await ctx.db.get_flag("paused_at"))
        missed = await ctx.db.count_state(STATE_PAUSED, paused_at) if paused_at else 0
        text = "▶️ Уведомления возобновлены."
        if missed:
            text += f"\nЗа время паузы было {missed} подходящих заказов — они не отправлялись."
        await message.answer(text)

    @admin.message(Command("stats"))
    async def cmd_stats(message: Message, ctx: AppContext) -> None:
        stats = await ctx.db.stats(utcnow() - timedelta(days=1))
        names = list(dict.fromkeys([*ctx.active_sources, *stats.keys()]))
        lines = ["📊 <b>За последние 24 часа</b>", ""]
        total = [0, 0, 0]
        for name in sorted(names, key=lambda n: list(SOURCE_META).index(n) if n in SOURCE_META else 99):
            emoji, title = SOURCE_META.get(name, ("📌", name))
            s = stats.get(name)
            found, matched, sent = (s.found, s.matched, s.sent) if s else (0, 0, 0)
            total = [total[0] + found, total[1] + matched, total[2] + sent]
            lines.append(f"{emoji} {html.escape(title)}: найдено {found} · подходящих {matched} · отправлено {sent}")
        lines += ["", f"Всего: найдено {total[0]} · подходящих {total[1]} · отправлено {total[2]}"]
        if ctx.notifier.paused:
            lines.append("⏸ Уведомления на паузе")
        await message.answer("\n".join(lines))

    @admin.message(Command("sources"))
    async def cmd_sources(message: Message, ctx: AppContext) -> None:
        states = await ctx.db.source_states()
        lines = ["🛰 <b>Источники</b>"]
        for name, (emoji, title) in SOURCE_META.items():
            active = name in ctx.active_sources
            st = states.get(name)
            lines.append("")
            lines.append(f"{emoji} <b>{html.escape(title)}</b> — {'включён' if active else 'выключен'}")
            if st is None:
                if active:
                    lines.append("   ещё не опрашивался")
                continue
            unit = "чатов" if name == "telegram" else "заказов"
            if st.last_success:
                count = f", {st.last_count} {unit}" if st.last_count is not None else ""
                lines.append(f"   ✅ последний успех: {fmt_time(st.last_success)}{count}")
            if st.last_error:
                failing = st.last_success is None or (st.last_error_at and st.last_error_at >= st.last_success)
                mark = "❗" if failing else "⚠️"
                lines.append(f"   {mark} последняя ошибка: {fmt_time(st.last_error_at)}")
                lines.append(f"   <code>{html.escape(st.last_error[:500])}</code>")
        for part in chunks("\n".join(lines)):
            await message.answer(part)

    @admin.message(Command("kw"))
    async def cmd_kw(message: Message, ctx: AppContext) -> None:
        ctx.keywords.maybe_reload()
        inc = ", ".join(f"<code>{html.escape(w)}</code>" for w in ctx.keywords.include.words) or "— (подходят все)"
        exc = ", ".join(f"<code>{html.escape(w)}</code>" for w in ctx.keywords.exclude.words) or "—"
        budget = ""
        if ctx.settings.min_budget:
            budget = f"\n\n💰 Минимальный бюджет: {ctx.settings.min_budget} ₽"
        if ctx.settings.skip_no_budget:
            budget += "\n🚫 Заказы без бюджета пропускаются"
        text = f"🔑 <b>Include</b> ({len(ctx.keywords.include)}):\n{inc}\n\n🚫 <b>Exclude</b>:\n{exc}{budget}"
        for part in chunks(text):
            await message.answer(part)

    @admin.message(Command("add_kw"))
    async def cmd_add_kw(message: Message, command: CommandObject, ctx: AppContext) -> None:
        words = split_words(command.args)
        if not words:
            await message.answer("Использование: <code>/add_kw svelte, telegram mini app</code>")
            return
        ctx.keywords.maybe_reload()
        added = ctx.keywords.add_include(words)
        skipped = [w for w in words if w not in added]
        text = []
        if added:
            text.append("✅ Добавлено: " + ", ".join(f"<code>{html.escape(w)}</code>" for w in added))
        if skipped:
            text.append("Уже были: " + ", ".join(f"<code>{html.escape(w)}</code>" for w in skipped))
        await message.answer("\n".join(text))

    @admin.message(Command("del_kw"))
    async def cmd_del_kw(message: Message, command: CommandObject, ctx: AppContext) -> None:
        words = split_words(command.args)
        if not words:
            await message.answer("Использование: <code>/del_kw слово</code>")
            return
        ctx.keywords.maybe_reload()
        removed = ctx.keywords.remove_include(words)
        missing = [w for w in words if w not in removed]
        text = []
        if removed:
            text.append("🗑 Удалено: " + ", ".join(f"<code>{html.escape(w)}</code>" for w in removed))
        if missing:
            text.append("Не найдено в include: " + ", ".join(f"<code>{html.escape(w)}</code>" for w in missing))
        await message.answer("\n".join(text))

    @router.message(CommandStart())
    async def cmd_start_stranger(message: Message) -> None:
        user_id = message.from_user.id if message.from_user else 0
        await message.answer(
            "Это личный бот для уведомлений о заказах.\n"
            f"Ваш Telegram ID: <code>{user_id}</code>\n"
            "Если это ваш бот — укажите этот ID в ADMIN_ID в файле .env и перезапустите программу."
        )

    return router
