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
* слово в двойных кавычках — точное совпадение целого слова: '"бот"' не найдёт «ботов»;
* стоп-слова (exclude) строже: допускаются только окончания того же слова — «курс» отсечёт
  «курсы», «курса», но не «курсор» и не «курсив».
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


# Любые «дефисы» (U+2010–2015, минус, неразрывный U+2011 — его ставят Kwork и FL.ru) → обычный «-».
_DASHES = re.compile(r"[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]")
# Все окончания, которые допускаются после основы в режиме «только словоформы» (для стоп-слов).
_RU_INFLECTIONS = "|".join(sorted(set(_RU_ENDINGS) | {"ии", "ию", "ую", "ою", "ым", "им", "ых", "их", "ям", "ами"},
                                  key=len, reverse=True))

PREFIX = "prefix"
"""include: слово ищется с начала слова и может продолжаться («бот» → «ботов», «ботинок»)."""
INFLECT = "inflect"
"""exclude: только словоформы того же слова («курс» → «курса», «курсы», но не «курсор»)."""


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).casefold().replace("ё", "е").replace("\u00ad", "")
    return _DASHES.sub("-", text)


def ru_stem(word: str) -> str:
    """Отбрасывает окончание русского слова, оставляя основу не короче 3 букв."""
    if len(word) < 4 or not _CYRILLIC.search(word):
        return word
    for ending in _RU_ENDINGS:
        if word.endswith(ending) and len(word) - len(ending) >= 3:
            return word[: -len(ending)]
    return word


def _escape(token: str) -> str:
    # точка между буквами необязательна: next.js = nextjs = next js; ведущая точка (.net) — обязательна
    return re.sub(r"(?<=\w)\\\.(?=\w)", r"[.\\s]?", re.escape(token))


def _token_pattern(token: str, *, last: bool, exact: bool, mode: str) -> str:
    if exact:
        return re.escape(token)
    if _CYRILLIC.search(token):
        stem = ru_stem(token)
        if stem == token and len(token) < 4 and not (last and mode == PREFIX):
            return re.escape(token)  # короткие слова внутри фразы: «в», «для», «на»
        if mode == INFLECT:
            return _escape(stem) + rf"(?:{_RU_INFLECTIONS})?(?!\w)"
        return _escape(stem) + r"\w*"
    body = _escape(token)
    if mode == INFLECT:
        return body + r"(?:e?s|'s)?(?!\w)"
    return body if last else body + r"(?:e?s)?"


def compile_keyword(keyword: str, mode: str = PREFIX) -> re.Pattern[str] | None:
    kw = keyword.strip()
    exact = len(kw) >= 2 and kw[0] == kw[-1] == '"'
    if exact:
        kw = kw[1:-1]
    tokens = [t for t in re.split(r"[\s\-_]+", normalize(kw)) if t]
    if not tokens:
        return None
    last = len(tokens) - 1
    body = _SEP.join(_token_pattern(t, last=i == last, exact=exact, mode=mode) for i, t in enumerate(tokens))
    prefix = r"(?<!\w)" if re.match(r"\w", tokens[0][0]) else ""
    suffix = r"(?!\w)" if exact and re.match(r"\w", tokens[-1][-1]) else ""
    return re.compile(prefix + body + suffix)


class KeywordFileError(RuntimeError):
    """keywords.yaml с ошибкой: перезаписывать его из бота нельзя."""


class KeywordSet:
    """Набор ключевых слов с предкомпилированными шаблонами."""

    def __init__(self, words: list[str], mode: str = PREFIX) -> None:
        self.mode = mode
        self.words: list[str] = []
        self._patterns: list[tuple[str, re.Pattern[str]]] = []
        for word in words:
            self.add(word)

    def add(self, word: str) -> bool:
        word = " ".join(str(word).split())
        if not word or normalize(word) in {normalize(w) for w in self.words}:
            return False
        pattern = compile_keyword(word, self.mode)
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
        self.exclude = KeywordSet(exclude if exclude is not None else DEFAULT_EXCLUDE, INFLECT)
        self._mtime: float | None = None
        self.load_error: str | None = None
        """Ошибка разбора keywords.yaml при последней перезагрузке (тогда файл нельзя перезаписывать)."""

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
        self.exclude = KeywordSet([str(w) for w in data.get("exclude") or []], INFLECT)
        self._mtime = self.path.stat().st_mtime
        self.load_error = None
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
            except Exception as exc:  # noqa: BLE001 — битый файл не должен ронять фильтрацию
                log.error("Не удалось перечитать %s, оставляю прежние слова: %s", self.path, exc)
                self._mtime = mtime
                self.load_error = f"{exc.__class__.__name__}: {exc}"

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
            "# include: слово ищется с начала слова — «бот» найдёт «бота», «чат-бот», но не «работа».\n"
            "# exclude: только формы того же слова — «курс» отсечёт «курсы», но не «курсор».\n"
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

    def _ensure_writable(self) -> None:
        self.maybe_reload()
        if self.load_error:
            raise KeywordFileError(
                f"{self.path.name} содержит ошибку, исправьте файл — иначе ваши правки будут потеряны: {self.load_error}"
            )

    def add_include(self, words: list[str]) -> list[str]:
        self._ensure_writable()
        added = [w for w in words if self.include.add(w)]
        if added:
            self.save()
        return added

    def remove_include(self, words: list[str]) -> list[str]:
        self._ensure_writable()
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
    (r"₸|тенге|\bkzt\b", "KZT"),  # «тг» не валюта: в чатах это «Телеграм»
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
