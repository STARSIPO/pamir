"""Telegram-источник: превращение сообщений Telethon в заказы (без сети)."""

from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from order_parser.sources.telegram import (
    extract_budget,
    message_link,
    message_to_order,
    normalize_chat_ref,
    split_title,
)


class Channel(SimpleNamespace):
    """Имя класса важно: ссылки t.me/c/... строятся только для каналов/супергрупп."""


def msg(text: str, message_id: int = 10, chat_id: int = -1001234567890):
    return SimpleNamespace(message=text, id=message_id, chat_id=chat_id,
                           date=datetime(2026, 10, 1, 9, 30, tzinfo=timezone.utc))


def test_message_to_order_public_channel():
    chat = Channel(id=1234567890, title="Фриланс заказы", username="freelance_orders")
    sender = SimpleNamespace(id=555, username="client", first_name="Иван")
    order = message_to_order(msg("Нужен Telegram-бот\nБюджет: 15 000 ₽\nСроки: неделя"), chat, sender)
    assert order is not None
    assert order.source == "telegram"
    assert order.external_id == "-1001234567890:10"
    assert order.title == "Нужен Telegram-бот"
    assert order.description == "Бюджет: 15 000 ₽\nСроки: неделя"
    assert order.budget == "15 000 ₽"
    assert order.url == "https://t.me/freelance_orders/10"
    assert order.raw["chat"] == "Фриланс заказы"
    assert order.raw["author"] == "@client"


def test_private_supergroup_link_and_channel_author():
    chat = Channel(id=1234567890, title="Закрытый чат", username=None)
    order = message_to_order(msg("Сделать сайт"), chat, chat)  # пост канала: отправитель = сам канал
    assert order.url == "https://t.me/c/1234567890/10"
    assert order.raw["author"] == ""
    assert order.description == ""


def test_basic_group_has_no_link():
    chat = SimpleNamespace(id=42, title="Группа", username=None)
    order = message_to_order(msg("Сделать сайт"), chat, None)
    assert order.url == ""


def test_empty_message_skipped():
    assert message_to_order(msg("   "), Channel(id=1, title="x", username="x"), None) is None


def test_long_single_line_title_truncated():
    text = "Сделать " + "очень " * 40 + "длинный сайт"
    title, description = split_title(text)
    assert len(title) <= 121 and title.endswith("…")
    assert description == text


@pytest.mark.parametrize(
    ("text", "budget"),
    [
        ("Нужен бот\nБюджет: 10 000 руб\nПиши в лс", "10 000 руб"),
        ("Ищу верстальщика, оплата 300$", "300$"),
        ("Оплата: договорная", "договорная"),
        ("Сделать лендинг за 5000₽ до пятницы", "5000₽"),
        ("Budget: $500", "$500"),
        ("Просто текст без денег", ""),
        ("Accurate rate needed", ""),
    ],
)
def test_extract_budget(text, budget):
    assert extract_budget(text) == budget


@pytest.mark.parametrize(
    ("ref", "expected"),
    [(-1001234567890, -1001234567890), ("-1001234567890", -1001234567890), ("@chat", "@chat"),
     ("https://t.me/chat", "https://t.me/chat")],
)
def test_normalize_chat_ref(ref, expected):
    assert normalize_chat_ref(ref) == expected


def test_message_link_uses_active_username_list():
    chat = Channel(id=1, title="x", username=None,
                   usernames=[SimpleNamespace(username="old", active=False), SimpleNamespace(username="new", active=True)])
    assert message_link(chat, 5) == "https://t.me/new/5"


@pytest.mark.parametrize(
    ("text", "budget"),
    [
        ("Оплата: 50% предоплата, 50% после сдачи\nБюджет: 30 000 руб", "30 000 руб"),
        ("Бюджет: договорной, срок 3 дня", "договорная"),
        ("Нужен бот для автопостинга в 10 ТГ каналов", ""),
        ("Цена 15к", "15к"),
        ("Бюджет 10 000 - 15 000 руб", "10 000 - 15 000 руб"),
        ("Стоимость: от 3000", "3000"),
    ],
)
def test_extract_budget_review_cases(text, budget):
    assert extract_budget(text) == budget


@pytest.mark.parametrize(
    ("phone", "normalized"),
    [("+7 (999) 123–45–67", "79991234567"), ("8 999 123 45 67", "79991234567"), ("+380 50 123 4567", "380501234567"),
     ("+81 3 1234 5678", "81312345678"), ("123", ""), ("", "")],
)
def test_normalize_phone(phone, normalized):
    from order_parser.sources.telegram import normalize_phone

    assert normalize_phone(phone) == normalized


@pytest.mark.parametrize(
    ("text", "budget"),
    [
        ("Нужен telegram бот на aiogram\nБюджет до 100 тысяч рублей", "100 тысяч рублей"),
        ("Оплата 300 долларов", "300 долларов"),
        ("Бюджет: 7 000 ₽ — 12 000 ₽", "7 000 ₽ — 12 000 ₽"),
        ("Нужен telegram бот для канала на 2к подписчиков, бюджет обсуждаем", ""),
        ("Нужен парсер Wildberries, 5k товаров в день", ""),
        ("Сайт-портфолио, 4K видео на главной", ""),
        ("Бюджет 50 т.р.", "50 т.р."),
    ],
)
def test_extract_budget_round2(text, budget):
    assert extract_budget(text) == budget
