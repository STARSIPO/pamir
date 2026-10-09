"""Общие объекты приложения, доступные обработчикам бота."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from order_parser.config import AppConfig, Settings
from order_parser.db import Database
from order_parser.filters import KeywordStore
from order_parser.notifier import Notifier


@dataclass(slots=True)
class AppContext:
    settings: Settings
    config: AppConfig
    db: Database
    keywords: KeywordStore
    notifier: Notifier
    active_sources: list[str] = field(default_factory=list)
    """Имена источников, запущенных в этом процессе."""
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
