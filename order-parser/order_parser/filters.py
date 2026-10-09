"""Фильтрация заказов: ключевые слова (include/exclude) и минимальный бюджет.

Правила сопоставления ключевых слов:
* регистр не важен, «ё» = «е», работает для русского и английского;
* слово ищется с начала слова и допускает окончания: «бот» найдёт «бота», «ботов»,
  «чат-бот», но не «работа»; «react» найдёт «reactjs»;
* у русских слов окончание отбрасывается: «веб-приложение» найдёт «веб-приложения»,
  «вакансия в штат» — «вакансии в штат»;
* фраза из нескольких слов допускает между словами пробелы, дефис, «_» или ничего:
  «mini app» найдёт «mini-app» и «miniapp»;
* точка внутри слова необязательна: «next.js» найдёт «nextjs» и «next js»;
* слово в двойных кавычках — точное совпадение целого слова: '"бот"' не найдёт «ботов».
"""

from __future__ import annotations

import logging
import os
import re
import tempfile
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from order_parser.models import Order

log = logging.getLogger(__name__)

DEFAULT_INCLUDE = [
    "telegram бот", "бот", "aiogram", "telegram bot", "mini app", "сайт", "лендинг",
    "веб-приложение", "next.js", "react", "vue", "nuxt", "fastapi", "nestjs", "парсер", "web app",
]
DEFAULT_EXCLUDE = ["ищу работу", "резюме", "вакансия в штат", "курс", "обучение"]

_SEP = r"[\s\-_]*"
_CYRILLIC = re.compile(r"[а-я]")
# Окончания русских слов (длинные раньше коротких): «приложение» → «приложен», «ёлка» → «елк».
_RU_ENDINGS = (
    "иями", "ями", "ами", "ией", "ием", "иям", "иях", "ого", "его", "ому", "ему", "ыми", "ими",
    "ая", "яя", "ое", "ее", "ые", "ие", "ый", "ий", "ой", "ей", "ия", "ье", "ья", "ам", "ям", "ах", "ях",
    "ом", "ем", "ов", "ев", "а", "я", "о", "е", "ы", "и", "ь", "й", "у", "ю",
)


def normalize(text: str) -> str:
    return unicodedata.normalize("NFKC", text).casefold().replace("ё", "е")


def ru_stem(word: str) -> str:
    """Отбрасывает окончание русского слова, оставляя основу не короче 3 букв."""
    if len(word) < 4 or not _CYRILLIC.search(word):
        return word
    for ending in _RU_ENDINGS:
        if word.endswith(ending) and len(word) - len(ending) >= 3:
            return word[: -len(ending)]
    return word


def _token_pattern(token: str, *, last: bool, exact: bool) -> str:
    if exact:
        body = re.escape(token)
    elif _CYRILLIC.search(token):
        stem = ru_stem(token)
        if stem == token and len(token) < 4 and not last:
            return re.escape(token)  # короткие предлоги внутри фразы: «в», «для», «на»
        return re.escape(stem).replace(r"\.", r"[.\s]?") + r"\w*"
    else:
        body = re.escape(token).replace(r"\.", r"[.\s]?")
    if last:
        return body
    return body if exact else body + r"(?:e?s)?"


def compile_keyword(keyword: str) -> re.Pattern[str] | None:
    kw = keyword.strip()
    exact = len(kw) >= 2 and kw[0] == kw[-1] == '"'
    if exact:
        kw = kw[1:-1]
    tokens = [t for t in re.split(r"[\s\-_]+", normalize(kw)) if t]
    if not tokens:
        return None
    body = _SEP.join(_token_pattern(t, last=i == len(tokens) - 1, exact=exact) for i, t in enumerate(tokens))
    prefix = r"(?<!\w)" if re.match(r"\w", tokens[0][0]) else ""
    suffix = r"(?!\w)" if exact and re.match(r"\w", tokens[-1][-1]) else ""
    return re.compile(prefix + body + suffix)


class KeywordSet:
    """Набор ключевых слов с предкомпилированными шаблонами."""

    def __init__(self, words: list[str]) -> None:
        self.words: list[str] = []
        self._patterns: list[tuple[str, re.Pattern[str]]] = []
        for word in words:
            self.add(word)

    def add(self, word: str) -> bool:
        word = " ".join(str(word).split())
        if not word or normalize(word) in {normalize(w) for w in self.words}:
            return False
        pattern = compile_keyword(word)
        if pattern is None:
            return False
        self.words.append(word)
        self._patterns.append((word, pattern))
        return True

    def remove(self, word: str) -> bool:
        target = normalize(" ".join(word.split()))
        for i, existing in enumerate(self.words):
            if normalize(existing) == target:
                del self.words[i]
                del self._patterns[i]
                return True
        return False

    def find(self, normalized_text: str) -> list[str]:
        return [word for word, pattern in self._patterns if pattern.search(normalized_text)]

    def __len__(self) -> int:
        return len(self.words)


class KeywordStore:
    """keywords.yaml: загрузка, сохранение, горячая перезагрузка при изменении файла."""

    def __init__(self, path: str | Path, include: list[str] | None = None, exclude: list[str] | None = None) -> None:
        self.path = Path(path)
        self.include = KeywordSet(include if include is not None else DEFAULT_INCLUDE)
        self.exclude = KeywordSet(exclude if exclude is not None else DEFAULT_EXCLUDE)
        self._mtime: float | None = None

    @classmethod
    def load(cls, path: str | Path) -> KeywordStore:
        store = cls(path)
        if store.path.exists():
            store.reload()
        else:
            log.warning("%s не найден — создаю со словами по умолчанию", store.path)
            store.save()
        return store

    def reload(self) -> None:
        with self.path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
        if not isinstance(data, dict):
            raise ValueError(f"{self.path}: ожидались ключи include и exclude")
        self.include = KeywordSet([str(w) for w in data.get("include") or []])
        self.exclude = KeywordSet([str(w) for w in data.get("exclude") or []])
        self._mtime = self.path.stat().st_mtime
        log.info("Ключевые слова: %d include, %d exclude", len(self.include), len(self.exclude))

    def maybe_reload(self) -> None:
        """Подхватывает ручные правки keywords.yaml без перезапуска."""
        try:
            mtime = self.path.stat().st_mtime
        except FileNotFoundError:
            return
        if self._mtime is not None and mtime != self._mtime:
            try:
                self.reload()
            except Exception:  # noqa: BLE001 — битый файл не должен ронять фильтрацию
                log.exception("Не удалось перечитать %s, оставляю прежние слова", self.path)
                self._mtime = mtime

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = yaml.safe_dump(
            {"include": self.include.words, "exclude": self.exclude.words},
            allow_unicode=True, sort_keys=False, default_flow_style=False,
        )
        header = (
            "# Ключевые слова для отбора заказов (регистр не важен, RU/EN).\n"
            "# include — заказ подходит, если найдено хотя бы одно слово/фраза.\n"
            "# exclude — стоп-слова: заказ отбрасывается, даже если include совпал.\n"
            "# Слово ищется с начала слова: «бот» найдёт «бота», «чат-бот», но не «работа».\n"
            "# Точное совпадение целого слова — слово в двойных кавычках, в YAML: - '\"бот\"'\n"
            "# Файл можно править вручную или командами бота /add_kw, /del_kw.\n"
        )
        fd, tmp = tempfile.mkstemp(dir=self.path.parent, prefix=".keywords.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(header + payload)
            os.replace(tmp, self.path)
        except BaseException:
            Path(tmp).unlink(missing_ok=True)
            raise
        self._mtime = self.path.stat().st_mtime

    def add_include(self, words: list[str]) -> list[str]:
        added = [w for w in words if self.include.add(w)]
        if added:
            self.save()
        return added

    def remove_include(self, words: list[str]) -> list[str]:
        removed = [w for w in words if self.include.remove(w)]
        if removed:
            self.save()
        return removed


# --- бюджет -----------------------------------------------------------------

_CURRENCY_MARKERS: list[tuple[str, str]] = [
    (r"₽|руб|(?<![а-яa-z])р(?![а-яa-z])|\brub\b|\brur\b", "RUB"),
    (r"\$|\busd\b|долл", "USD"),
    (r"€|\beur\b|евро", "EUR"),
    (r"£|\bgbp\b", "GBP"),
    (r"₴|грн|\buah\b", "UAH"),
    (r"₸|\bтг\b|тенге|\bkzt\b", "KZT"),
    (r"₹|\binr\b", "INR"),
]
_NUMBER = re.compile(
    r"(?<![\d.,])(\d{1,3}(?:[ \u00a0\u202f,.]\d{3})+(?!\d)|\d+)(?:[.,](\d{1,2})(?!\d))?\s*(тыс\.?|k\b|к\b)?",
    re.IGNORECASE,
)


_HOURLY = re.compile(r"/\s*(?:час|ч|hr|hour|h)\b|за\s+час|в\s+час|per\s+hour|hourly", re.IGNORECASE)


def is_hourly(budget: str) -> bool:
    """Почасовая ставка («2 500 руб. за час», «$15–25 USD /час») — с бюджетом проекта не сравнивается."""
    return bool(budget and _HOURLY.search(budget))


def parse_budget(text: str, default_currency: str = "RUB") -> tuple[float | None, str]:
    """Достаёт верхнюю границу бюджета и валюту из строки вида «до 10 000 ₽», «$30–250»."""
    if not text:
        return None, default_currency
    norm = normalize(text)
    currency = default_currency
    for pattern, code in _CURRENCY_MARKERS:
        if re.search(pattern, norm):
            currency = code
            break
    values: list[float] = []
    for whole, frac, thousands in _NUMBER.findall(norm):
        number = float(re.sub(r"[\s,.]", "", whole) + (f".{frac}" if frac else ""))
        if thousands:
            number *= 1000
        values.append(number)
    return (max(values) if values else None), currency


@dataclass(slots=True)
class FilterResult:
    ok: bool
    reason: str = ""
    matched: list[str] = field(default_factory=list)


class OrderFilter:
    def __init__(
        self,
        keywords: KeywordStore,
        min_budget: int = 0,
        skip_no_budget: bool = False,
        currency_rates: dict[str, float] | None = None,
    ) -> None:
        self.keywords = keywords
        self.min_budget = min_budget
        self.skip_no_budget = skip_no_budget
        self.rates = {k.upper(): v for k, v in (currency_rates or {"RUB": 1.0}).items()}

    def budget_rub(self, order: Order) -> float | None:
        value, currency = order.budget_value, (order.currency or "RUB").upper()
        if value is None:
            value, currency = parse_budget(order.budget, currency)
        if value is None or value <= 0:
            return None
        rate = self.rates.get(currency.upper())
        return value * rate if rate is not None else None

    def check(self, order: Order) -> FilterResult:
        self.keywords.maybe_reload()
        text = normalize(order.match_text)
        stop = self.keywords.exclude.find(text)
        if stop:
            return FilterResult(False, f"стоп-слово: {', '.join(stop)}")
        matched = self.keywords.include.find(text)
        if len(self.keywords.include) and not matched:
            return FilterResult(False, "нет ключевых слов")
        if (self.min_budget or self.skip_no_budget) and not is_hourly(order.budget):
            rub = self.budget_rub(order)
            if rub is None:
                if self.skip_no_budget:
                    return FilterResult(False, "бюджет не указан", matched)
            elif self.min_budget and rub < self.min_budget:
                return FilterResult(False, f"бюджет ~{rub:.0f} ₽ < {self.min_budget} ₽", matched)
        return FilterResult(True, "", matched)
