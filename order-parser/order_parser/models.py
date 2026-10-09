"""Модель заказа — общий формат для всех источников."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class Order:
    source: str
    """Короткое имя источника: fl, kwork, habr, freelancer, telegram."""
    external_id: str
    """Идентификатор заказа внутри источника (уникален в паре с source)."""
    title: str
    description: str = ""
    budget: str = ""
    """Бюджет в человекочитаемом виде, может быть пустым («договорная» → пусто)."""
    url: str = ""
    published_at: datetime | None = None
    raw: Any = field(default=None, repr=False)
    """Исходные данные источника (dict из JSON, элемент RSS и т.п.)."""
    budget_value: float | None = None
    """Верхняя граница бюджета числом, если источник отдаёт её явно."""
    currency: str = ""
    """Валюта budget_value (ISO-код: RUB, USD, EUR...)."""
    feeds: tuple[str, ...] = field(default=(), repr=False)
    """Ленты источника (категории/запросы), в которых встретился заказ — для первичной разметки по лентам."""

    @property
    def key(self) -> tuple[str, str]:
        return self.source, self.external_id

    @property
    def match_text(self) -> str:
        """Текст, по которому ищутся ключевые слова."""
        return f"{self.title}\n{self.description}"
