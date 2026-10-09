"""Источники заказов. Каждый модуль реализует Source.fetch() -> list[Order]."""

from __future__ import annotations

from collections.abc import Callable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from order_parser.config import AppConfig, Settings
    from order_parser.sources.base import Source

# имя -> (эмодзи, название). Порядок — порядок вывода в /stats и /sources.
SOURCE_META: dict[str, tuple[str, str]] = {
    "fl": ("🟢", "FL.ru"),
    "kwork": ("🟠", "Kwork"),
    "habr": ("🟣", "Habr Freelance"),
    "freelancer": ("🌐", "Freelancer.com"),
    "telegram": ("✈️", "Telegram"),
}

SITE_SOURCES = ("fl", "kwork", "habr", "freelancer")


def build_site_sources(
    settings: Settings,
    config: AppConfig,
    only: set[str] | None = None,
    keywords: Callable[[], list[str]] | None = None,
) -> list[Source]:
    """Создаёт включённые в .env источники-сайты (Telegram запускается отдельно)."""
    from order_parser.sources.fl import FlSource
    from order_parser.sources.freelancer import FreelancerSource
    from order_parser.sources.habr import HabrSource
    from order_parser.sources.kwork import KworkSource

    http_kwargs = {"timeout": settings.http_timeout, "retries": settings.http_retries,
                   "user_agent": settings.user_agent, "proxy": settings.sites_proxy}
    factories = {
        "fl": lambda: FlSource(config.fl, **http_kwargs),
        "kwork": lambda: KworkSource(config.kwork, **http_kwargs),
        "habr": lambda: HabrSource(config.habr, **http_kwargs),
        "freelancer": lambda: FreelancerSource(config.freelancer, keywords, **http_kwargs),
    }
    sources: list[Source] = []
    for name in SITE_SOURCES:
        if only is not None and name not in only:
            continue
        if only is None and not settings.source_enabled(name):
            continue
        sources.append(factories[name]())
    return sources
