"""Проверка парсеров на свежих ответах, сохранённых `python -m order_parser.capture`.

Без файлов в tests/fixtures/live/ тесты пропускаются.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from order_parser.sources.fl import parse_feed
from order_parser.sources.freelancer import parse_response
from order_parser.sources.habr import parse_tasks_html, parse_tasks_rss
from order_parser.sources.kwork import parse_json, parse_state_html

LIVE = Path(__file__).resolve().parent / "fixtures" / "live"


def _meta(path: Path) -> list[str]:
    meta = path.with_name(path.name + ".meta.txt")
    return meta.read_text(encoding="utf-8").splitlines() if meta.exists() else []


def _status(path: Path) -> int:
    for line in _meta(path):
        if line.startswith("HTTP "):
            return int(line.split()[1])
    return 200


def _request_line(path: Path) -> str:
    lines = _meta(path)
    return lines[0] if lines else ""


def _files() -> list[Path]:
    if not LIVE.exists():
        return []
    return sorted(p for p in LIVE.glob("*/*") if not p.name.endswith(".meta.txt"))


def parse_live(path: Path):
    source, ext, data = path.parent.name, path.suffix, path.read_bytes()
    if source == "fl":
        if "/rss/" not in _request_line(path) and ext != ".xml":
            pytest.skip("не лента (например, прогрев главной страницы)")
        return parse_feed(data)[1]
    if source == "kwork":
        return parse_json(json.loads(data)) if ext == ".json" else parse_state_html(data.decode("utf-8"))
    if source == "habr":
        return parse_tasks_rss(data) if ext == ".xml" else parse_tasks_html(data.decode("utf-8"))
    if source == "freelancer":
        return parse_response(json.loads(data))
    pytest.skip(f"неизвестный источник {source}")


FILES = _files()


@pytest.mark.skipif(not FILES, reason="нет сохранённых живых ответов (python -m order_parser.capture)")
@pytest.mark.parametrize("path", FILES, ids=[f"{p.parent.name}/{p.name}" for p in FILES])
def test_live_response_parses(path: Path):
    if _status(path) != 200:
        pytest.skip(f"сайт ответил HTTP {_status(path)} — смотрите .meta.txt")
    orders = parse_live(path)
    assert orders, "парсер не нашёл ни одного заказа — возможно, сайт изменил формат"
    for order in orders:
        assert order.external_id and order.title, order
        assert order.url.startswith("https://"), order
