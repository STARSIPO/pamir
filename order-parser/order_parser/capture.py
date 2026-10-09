"""Сохранение живых ответов сайтов для проверки парсеров.

    python -m order_parser.capture            # все сайты, включённые в .env
    python -m order_parser.capture fl kwork   # только выбранные

Ответы складываются в tests/fixtures/live/<источник>/, после чего
`python -m pytest tests/test_live_fixtures.py` проверяет, что парсеры их понимают.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime

import httpx

from order_parser.config import BASE_DIR, load_app_config, load_settings
from order_parser.sources import SITE_SOURCES, build_site_sources
from order_parser.sources.base import HttpSource, describe_error

LIVE_DIR = BASE_DIR / "tests" / "fixtures" / "live"


def extension(response: httpx.Response) -> str:
    kind = response.headers.get("content-type", "").lower()
    head = response.content[:200].lstrip().lower()
    if "json" in kind or head.startswith((b"{", b"[")):
        return "json"
    if "xml" in kind or "rss" in kind or head.startswith((b"<?xml", b"<rss", b"<feed")):
        return "xml"
    return "html"


async def capture(names: list[str]) -> int:
    settings = load_settings()
    config = load_app_config(settings.config_file)
    only = set(names) if names else None
    sources = build_site_sources(settings, config, only)
    if not sources:
        print(f"Нет источников. Доступны: {', '.join(SITE_SOURCES)}")
        return 2
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    failed = 0
    for source in sources:
        assert isinstance(source, HttpSource)
        source.recorded = []
        try:
            orders = await source.fetch()
            status = f"OK, заказов: {len(orders)}"
        except Exception as exc:  # noqa: BLE001
            status = f"ОШИБКА: {describe_error(exc)}"
            failed += 1
        finally:
            await source.aclose()
        folder = LIVE_DIR / source.name
        folder.mkdir(parents=True, exist_ok=True)
        print(f"{source.emoji} {source.title}: {status}")
        for i, response in enumerate(source.recorded or []):
            path = folder / f"{stamp}_{i}.{extension(response)}"
            path.write_bytes(response.content)
            meta = (f"{response.request.method} {response.request.url}\nHTTP {response.status_code}\n"
                    + "".join(f"{k}: {v}\n" for k, v in response.headers.items()))
            path.with_name(path.name + ".meta.txt").write_text(meta, encoding="utf-8")
            print(f"   сохранено: {path.relative_to(BASE_DIR)} (HTTP {response.status_code}, "
                  f"{len(response.content)} байт)")
    print("\nПроверить парсеры на сохранённом: python -m pytest tests/test_live_fixtures.py -v")
    return 1 if failed else 0


def main() -> None:
    names = [n.lower() for n in sys.argv[1:]]
    unknown = set(names) - set(SITE_SOURCES)
    if unknown:
        raise SystemExit(f"Неизвестные источники: {', '.join(sorted(unknown))}. Доступны: {', '.join(SITE_SOURCES)}")
    sys.exit(asyncio.run(capture(names)))


if __name__ == "__main__":
    main()
