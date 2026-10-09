from __future__ import annotations

import pytest
import yaml

from order_parser.filters import (
    DEFAULT_EXCLUDE,
    DEFAULT_INCLUDE,
    KeywordSet,
    KeywordStore,
    OrderFilter,
    normalize,
    parse_budget,
)
from order_parser.models import Order


def make_filter(tmp_path, include=None, exclude=None, **kwargs) -> OrderFilter:
    store = KeywordStore(tmp_path / "keywords.yaml", include, exclude)
    return OrderFilter(store, **kwargs)


def order(title: str, description: str = "", budget: str = "", **kwargs) -> Order:
    return Order(source="test", external_id="1", title=title, description=description, budget=budget, **kwargs)


# --- ключевые слова ---------------------------------------------------------


@pytest.mark.parametrize(
    "text",
    [
        "Нужен Telegram бот для записи клиентов",
        "Разработать TELEGRAM-БОТ на aiogram",
        "Сделать чат-бота для магазина",
        "Требуется доработка ботов",
        "Create a Telegram bot for crypto alerts",
        "Landing page на Next.js",
        "Нужен сайт-визитка",
        "Разработка лендинга под ключ",
        "Frontend на ReactJS",
        "SPA на Vue 3",
        "Сайт на Nuxt3",
        "Backend на FastAPI",
        "API на NestJS",
        "Написать парсер авито",
        "Telegram Mini App для кафе",
        "Нужно веб-приложение для учёта",
        "Build a web app MVP",
    ],
)
def test_default_include_matches(tmp_path, text):
    result = make_filter(tmp_path).check(order(text))
    assert result.ok, result.reason


@pytest.mark.parametrize(
    "text",
    [
        "Работа на складе",  # «бот» внутри слова «работа» не считается
        "Переводчик с английского",
        "Логотип для кофейни",
    ],
)
def test_unrelated_orders_rejected(tmp_path, text):
    result = make_filter(tmp_path).check(order(text))
    assert not result.ok
    assert result.reason == "нет ключевых слов"


@pytest.mark.parametrize(
    "text",
    [
        "Ищу работу telegram бот разработчиком",
        "Резюме: разработчик сайтов на React",
        "Вакансия в штат: React разработчик",
        "Курс по созданию ботов",
        "Обучение созданию сайтов",
        "Курсы React для начинающих",
    ],
)
def test_default_exclude_wins(tmp_path, text):
    result = make_filter(tmp_path).check(order(text))
    assert not result.ok
    assert result.reason.startswith("стоп-слово")


def test_case_insensitive_and_yo(tmp_path):
    f = make_filter(tmp_path, include=["ёлка"], exclude=[])
    assert f.check(order("ЕЛКА на сайт")).ok
    assert f.check(order("Ёлки для сайта")).ok


def test_match_in_description(tmp_path):
    f = make_filter(tmp_path)
    assert f.check(order("Срочный заказ", "Нужен бот для учёта заявок")).ok


def test_multiword_phrase_separators(tmp_path):
    f = make_filter(tmp_path, include=["mini app"], exclude=[])
    for text in ("Telegram mini app", "Telegram Mini-App", "Telegram miniapp", "mini_apps"):
        assert f.check(order(text)).ok, text
    assert not f.check(order("mini cooper app")).ok


def test_dotted_keyword_variants(tmp_path):
    f = make_filter(tmp_path, include=["next.js"], exclude=[])
    for text in ("Next.js", "NextJS", "next js"):
        assert f.check(order(text)).ok, text


def test_exact_keyword_in_quotes(tmp_path):
    f = make_filter(tmp_path, include=['"бот"'], exclude=[])
    assert f.check(order("нужен бот")).ok
    assert not f.check(order("нужно много ботов")).ok


def test_word_start_boundary(tmp_path):
    f = make_filter(tmp_path, include=["бот"], exclude=[])
    assert not f.check(order("Работа и робот")).ok
    assert f.check(order("чат-бот")).ok


def test_empty_include_passes_everything_except_stopwords(tmp_path):
    f = make_filter(tmp_path, include=[], exclude=["курс"])
    assert f.check(order("Что угодно")).ok
    assert not f.check(order("Курс по чему угодно")).ok


def test_matched_keywords_reported(tmp_path):
    result = make_filter(tmp_path).check(order("Telegram бот на aiogram"))
    assert {"telegram бот", "бот", "aiogram"} <= set(result.matched)


def test_keyword_set_dedup_and_remove():
    ks = KeywordSet(["React", "react ", "Vue"])
    assert ks.words == ["React", "Vue"]
    assert not ks.add("REACT")
    assert ks.remove("react")
    assert ks.words == ["Vue"]
    assert not ks.remove("angular")


def test_normalize():
    assert normalize("ЁЖИК Next.JS") == "ежик next.js"


# --- keywords.yaml ----------------------------------------------------------


def test_store_creates_file_with_defaults(tmp_path):
    path = tmp_path / "keywords.yaml"
    store = KeywordStore.load(path)
    assert path.exists()
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert data["include"] == DEFAULT_INCLUDE
    assert data["exclude"] == DEFAULT_EXCLUDE
    assert store.include.words == DEFAULT_INCLUDE


def test_store_add_remove_persist(tmp_path):
    path = tmp_path / "keywords.yaml"
    store = KeywordStore.load(path)
    assert store.add_include(["svelte", "бот"]) == ["svelte"]
    assert store.remove_include(["react", "angular"]) == ["react"]
    reloaded = KeywordStore.load(path)
    assert "svelte" in reloaded.include.words
    assert "react" not in reloaded.include.words


def test_store_hot_reload(tmp_path):
    path = tmp_path / "keywords.yaml"
    store = KeywordStore.load(path)
    f = OrderFilter(store)
    assert not f.check(order("Нужен дизайн логотипа")).ok
    path.write_text(yaml.safe_dump({"include": ["логотип"], "exclude": []}, allow_unicode=True), encoding="utf-8")
    import os

    stat = path.stat()
    os.utime(path, (stat.st_atime, stat.st_mtime + 5))
    assert f.check(order("Нужен дизайн логотипа")).ok


def test_store_broken_file_keeps_previous_words(tmp_path):
    path = tmp_path / "keywords.yaml"
    store = KeywordStore.load(path)
    path.write_text("include: [unclosed", encoding="utf-8")
    import os

    stat = path.stat()
    os.utime(path, (stat.st_atime, stat.st_mtime + 5))
    store.maybe_reload()
    assert store.include.words == DEFAULT_INCLUDE


# --- бюджет -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("text", "value", "currency"),
    [
        ("5 000 ₽", 5000, "RUB"),
        ("до 10 000 руб.", 10000, "RUB"),
        ("250 000  ₽", 250000, "RUB"),
        ("$30–250 USD", 250, "USD"),
        ("от 50 000 до 100 000 ₽", 100000, "RUB"),
        ("15 тыс. руб", 15000, "RUB"),
        ("5000р", 5000, "RUB"),
        ("300$", 300, "USD"),
        ("€1,200", 1200, "EUR"),
        ("$1,200.50", 1200.5, "USD"),
        ("1000.00", 1000, "RUB"),
        ("2.5k $", 2500, "USD"),
        ("1 500 грн", 1500, "UAH"),
    ],
)
def test_parse_budget(text, value, currency):
    assert parse_budget(text) == (pytest.approx(value), currency)


@pytest.mark.parametrize("text", ["", "Договорная", "по договоренности"])
def test_parse_budget_empty(text):
    assert parse_budget(text)[0] is None


def test_min_budget(tmp_path):
    f = make_filter(tmp_path, min_budget=5000, currency_rates={"RUB": 1, "USD": 90})
    assert f.check(order("Сайт", budget="10 000 ₽")).ok
    rejected = f.check(order("Сайт", budget="3 000 ₽"))
    assert not rejected.ok and "бюджет" in rejected.reason
    assert f.check(order("Сайт", budget="$100")).ok  # 9000 ₽
    assert not f.check(order("Сайт", budget="$30")).ok  # 2700 ₽
    assert f.check(order("Сайт", budget="")).ok  # без бюджета пропускаем, флаг выключен


def test_skip_no_budget(tmp_path):
    f = make_filter(tmp_path, skip_no_budget=True)
    assert not f.check(order("Сайт", budget="")).ok
    assert not f.check(order("Сайт", budget="Договорная")).ok
    assert f.check(order("Сайт", budget="1 000 ₽")).ok


def test_explicit_budget_value_wins(tmp_path):
    f = make_filter(tmp_path, min_budget=5000, currency_rates={"RUB": 1, "USD": 90})
    assert f.check(order("Сайт", budget="до 1 000 ₽ (допустимо до 9 000 ₽)", budget_value=9000, currency="RUB")).ok
    assert f.check(order("React app", budget="$50–100", budget_value=100, currency="USD")).ok


def test_unknown_currency_treated_as_no_budget(tmp_path):
    f = make_filter(tmp_path, min_budget=5000, currency_rates={"RUB": 1})
    assert f.check(order("Сайт", budget_value=10, currency="XYZ")).ok
    f.skip_no_budget = True
    assert not f.check(order("Сайт", budget_value=10, currency="XYZ")).ok


@pytest.mark.parametrize(
    ("keyword", "text"),
    [
        ("веб-приложение", "Разработка веб-приложения для склада"),
        ("веб-приложение", "Несколько веб-приложений"),
        ("вакансия в штат", "Открыта вакансии в штат компании"),
        ("ищу работу", "Ищу работы на лето"),
        ("обучение", "Нужно обучения персонала"),
        ("лендинг", "Сделать лендинги"),
        ("telegram bot", "Several Telegram bots"),
        ("web app", "Progressive web application"),
    ],
)
def test_russian_and_english_inflections(tmp_path, keyword, text):
    f = make_filter(tmp_path, include=[keyword], exclude=[])
    assert f.check(order(text)).ok


def test_prefix_vs_exact(tmp_path):
    # Поиск по началу слова: «бот» находит и «ботинок» — для точного совпадения есть кавычки.
    assert make_filter(tmp_path, include=["бот"], exclude=[]).check(order("Большой ботинок")).ok
    assert not make_filter(tmp_path, include=['"бот"'], exclude=[]).check(order("Большой ботинок")).ok


def test_short_inner_words_are_exact(tmp_path):
    f = make_filter(tmp_path, include=["вакансия в штат"], exclude=[])
    assert f.check(order("Вакансии в штат")).ok
    assert not f.check(order("Вакансия высокий штат")).ok


# --- регрессии из ревью ---------------------------------------------------------


@pytest.mark.parametrize("text", ["Telegram Mini‑App для кафе", "Разработка веб‑приложения", "web‐app"])
def test_unicode_hyphens(tmp_path, text):
    assert make_filter(tmp_path).check(order(text)).ok


@pytest.mark.parametrize(
    ("text", "excluded"),
    [
        ("Курсы React для начинающих", True),
        ("Нужен бот, курс по python в подарок", True),
        ("Сайт, где курсор меняет цвет", False),
        ("Лендинг, заголовки курсивом", False),
        ("Бот с обученной нейросетью", False),
        ("Ищу работника для сайта", False),
        ("Ищу работу: сделаю сайт", True),
        ("Резюмирование статей ботом", False),
    ],
)
def test_exclude_matches_word_forms_only(tmp_path, text, excluded):
    result = make_filter(tmp_path).check(order(text))
    assert (not result.ok and result.reason.startswith("стоп-слово")) is excluded, result


def test_leading_dot_keyword(tmp_path):
    f = make_filter(tmp_path, include=[".net"], exclude=[])
    assert f.check(order("Backend на ASP.NET Core")).ok
    assert f.check(order(".NET 8 сервис")).ok
    assert not f.check(order("Настроить home network")).ok
    assert not f.check(order("Интернет-магазин")).ok


def test_tg_is_not_tenge():
    assert parse_budget("10 ТГ каналов")[1] == "RUB"
    assert parse_budget("5000 тенге") == (5000, "KZT")


def test_bot_refuses_to_overwrite_broken_file(tmp_path):
    import os

    from order_parser.filters import KeywordFileError

    path = tmp_path / "keywords.yaml"
    store = KeywordStore.load(path)
    path.write_text("include:\n\t- svelte\n", encoding="utf-8")
    stat = path.stat()
    os.utime(path, (stat.st_atime, stat.st_mtime + 5))
    with pytest.raises(KeywordFileError):
        store.add_include(["angular"])
    assert "\t- svelte" in path.read_text(encoding="utf-8")  # ручная правка не затёрта


@pytest.mark.parametrize(("text", "value"), [("100 тысяч рублей", 100_000), ("50 т.р.", 50_000), ("1.5 млн", 1_500_000)])
def test_parse_budget_scales(text, value):
    assert parse_budget(text)[0] == pytest.approx(value)


def test_exclude_phrase_joined_spelling(tmp_path):
    f = make_filter(tmp_path, include=[], exclude=["full time"])
    assert not f.check(order("Fulltime job")).ok
    assert not f.check(order("full-time position")).ok
    assert f.check(order("full timer app")).ok
