"""Конфигурация: секреты и флаги из .env (pydantic-settings), списки из config.yaml."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Union

import yaml
from pydantic import BaseModel, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
"""Корень проекта (папка с run.sh, config.yaml, .env)."""


def resolve_path(value: str | Path) -> Path:
    """Относительные пути считаются от корня проекта, а не от текущей папки."""
    path = Path(value).expanduser()
    return path if path.is_absolute() else BASE_DIR / path


class Settings(BaseSettings):
    """Значения из .env / переменных окружения."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    # Бот-уведомитель
    bot_token: str = ""
    admin_id: int = 0

    # Telethon userbot (my.telegram.org)
    tg_api_id: int = 0
    tg_api_hash: str = ""
    tg_phone: str = ""
    tg_session: str = "data/userbot"

    # Планировщик
    poll_interval: int = Field(180, ge=30, description="секунды между опросами сайтов")
    poll_jitter: float = Field(0.2, ge=0.0, le=0.9)

    # Флаги источников
    source_fl: bool = True
    source_kwork: bool = True
    source_habr: bool = False  # Habr Freelance закрыт 28.02.2025
    source_freelancer: bool = True
    source_telegram: bool = True

    # Фильтр по бюджету (в рублях; 0 — не фильтровать)
    min_budget: int = Field(0, ge=0)
    skip_no_budget: bool = False

    # Отправка
    send_delay: float = Field(1.5, ge=0.0)

    # HTTP
    http_timeout: float = Field(20.0, gt=0)
    http_retries: int = Field(3, ge=0, le=10)
    user_agent: str = ""
    sites_proxy: str = ""
    """Прокси для запросов к сайтам (http://user:pass@host:port), например если Kwork/FL блокируют ваш IP."""

    # Пути и логи
    log_level: str = "INFO"
    db_path: str = "data/orders.db"
    config_file: str = "config.yaml"
    keywords_file: str = "keywords.yaml"
    logs_dir: str = "logs"

    def source_enabled(self, name: str) -> bool:
        return bool(getattr(self, f"source_{name}", False))

    @property
    def telegram_configured(self) -> bool:
        return bool(self.tg_api_id and self.tg_api_hash)


ChatRef = Union[int, str]


class TelegramConfig(BaseModel):
    chats: list[ChatRef] = Field(default_factory=list)
    """Чаты/каналы: @username, ссылка t.me/..., или числовой id (-100...)."""


class FlConfig(BaseModel):
    categories: list[int] = Field(default_factory=list)
    """Группы FL.ru для RSS (?category=N): 5 Программирование, 2 Сайты, 34 Мессенджеры..."""
    subcategories: list[int] = Field(default_factory=list)
    """Подкатегории (?subcategory=N): 279 Чат-боты, 280 Парсинг, 37 Веб-программирование..."""


class KworkConfig(BaseModel):
    categories: list[Union[int, str]] = Field(default_factory=lambda: [11])
    """Категории биржи Kwork (параметр c=): 11 — весь раздел «Разработка и IT», "all" — все."""
    pages: int = Field(1, ge=1, le=5)


class HabrConfig(BaseModel):
    categories: list[str] = Field(default_factory=list)
    """Слаги категорий Habr Freelance (development_bots и т.п.). Пусто — все задачи."""
    pages: int = Field(1, ge=1, le=10)


# Английские слова из ключевых слов по умолчанию: на Freelancer.com заказы почти только на английском.
DEFAULT_FREELANCER_QUERIES = ["telegram bot", "mini app", "web app", "react", "next.js", "vue", "nuxt", "fastapi", "nestjs"]


class FreelancerConfig(BaseModel):
    queries: list[str] = Field(default_factory=lambda: list(DEFAULT_FREELANCER_QUERIES))
    """Поисковые запросы (каждый — отдельный запрос за цикл). Пусто — одна общая выборка свежих проектов."""
    limit: int = Field(30, ge=1, le=100)


DEFAULT_RATES = {
    "RUB": 1.0, "USD": 90.0, "EUR": 100.0, "GBP": 115.0, "AUD": 60.0, "CAD": 65.0,
    "NZD": 55.0, "SGD": 68.0, "HKD": 11.5, "INR": 1.05, "PHP": 1.6, "PKR": 0.32,
    "UAH": 2.2, "KZT": 0.18, "BYN": 28.0, "JPY": 0.6, "CNY": 12.5, "AED": 24.5,
}


class FiltersConfig(BaseModel):
    currency_rates: dict[str, float] = Field(default_factory=lambda: dict(DEFAULT_RATES))
    """Курс к рублю для сравнения с MIN_BUDGET. Неизвестная валюта — бюджет считается неизвестным."""


class AppConfig(BaseModel):
    telegram: TelegramConfig = Field(default_factory=TelegramConfig)
    fl: FlConfig = Field(default_factory=FlConfig)
    kwork: KworkConfig = Field(default_factory=KworkConfig)
    habr: HabrConfig = Field(default_factory=HabrConfig)
    freelancer: FreelancerConfig = Field(default_factory=FreelancerConfig)
    filters: FiltersConfig = Field(default_factory=FiltersConfig)


def load_app_config(path: str | Path) -> AppConfig:
    path = resolve_path(path)
    if not path.exists():
        log.warning("Файл %s не найден — использую настройки по умолчанию", path)
        return AppConfig()
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: ожидался словарь верхнего уровня")
    try:
        cfg = AppConfig.model_validate(data)
    except ValidationError as exc:
        raise ValueError(f"Ошибка в {path}:\n{exc}") from exc
    # Курсы из файла дополняют встроенные, а не заменяют их целиком.
    rates = dict(DEFAULT_RATES)
    rates.update({k.upper(): float(v) for k, v in (data.get("filters") or {}).get("currency_rates", {}).items()})
    cfg.filters.currency_rates = rates
    return cfg


def load_settings(env_file: str | Path | None = None) -> Settings:
    if env_file is not None:
        return Settings(_env_file=resolve_path(env_file))  # type: ignore[call-arg]
    return Settings()
