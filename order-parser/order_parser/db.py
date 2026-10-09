"""SQLite-хранилище: дедупликация (таблица seen), состояние источников, статистика."""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import aiosqlite

from order_parser.models import Order

log = logging.getLogger(__name__)

STATE_BASELINE = "baseline"  # помечен при первом запуске источника, не отправлялся
STATE_FILTERED = "filtered"  # не прошёл фильтры
STATE_PAUSED = "paused"  # подходил, но бот был на паузе
STATE_QUEUED = "queued"  # в очереди на отправку
STATE_SENT = "sent"
STATE_FAILED = "failed"  # Telegram отказал в доставке
MATCHED_STATES = (STATE_PAUSED, STATE_QUEUED, STATE_SENT, STATE_FAILED)

SCHEMA = """
CREATE TABLE IF NOT EXISTS seen (
    source      TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    url         TEXT NOT NULL DEFAULT '',
    first_seen  TEXT NOT NULL,
    state       TEXT NOT NULL,  -- baseline | filtered | paused | queued | sent | failed
    reason      TEXT NOT NULL DEFAULT '',
    payload     TEXT,           -- готовое сообщение (JSON) для повторной отправки
    sent_at     TEXT,
    UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS ix_seen_first_seen ON seen (first_seen);
CREATE INDEX IF NOT EXISTS ix_seen_state ON seen (state);

CREATE TABLE IF NOT EXISTS source_state (
    source        TEXT PRIMARY KEY,
    initialized   INTEGER NOT NULL DEFAULT 0,
    last_run      TEXT,
    last_success  TEXT,
    last_count    INTEGER,
    last_error    TEXT,
    last_error_at TEXT
);

CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def parse_ts(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


@dataclass(slots=True)
class SourceState:
    source: str
    initialized: bool
    last_run: datetime | None
    last_success: datetime | None
    last_count: int | None
    last_error: str | None
    last_error_at: datetime | None


@dataclass(slots=True)
class SourceStats:
    found: int = 0
    matched: int = 0
    sent: int = 0


class Database:
    def __init__(self, path: str | Path) -> None:
        self.path = str(path)
        self._conn: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        connection = aiosqlite.connect(self.path)
        # Рабочий поток aiosqlite не должен держать процесс, если выход прерван (повторный Ctrl+C):
        # в aiosqlite 0.22 это connection._thread, в старых версиях — сам объект Connection.
        worker = getattr(connection, "_thread", connection)
        if isinstance(worker, threading.Thread):
            worker.daemon = True
        self._conn = await connection
        self._conn.row_factory = aiosqlite.Row
        if self.path != ":memory:":
            await self._conn.execute("PRAGMA journal_mode=WAL")
        await self._conn.executescript(SCHEMA)
        await self._conn.commit()

    async def close(self) -> None:
        if self._conn is not None:
            await self._conn.close()
            self._conn = None

    @property
    def conn(self) -> aiosqlite.Connection:
        if self._conn is None:
            raise RuntimeError("Database is not connected")
        return self._conn

    # --- дедупликация -------------------------------------------------------

    async def unseen_ids(self, source: str, external_ids: list[str]) -> set[str]:
        """Какие из external_ids ещё не встречались."""
        ids = list(dict.fromkeys(external_ids))
        seen: set[str] = set()
        for i in range(0, len(ids), 500):
            chunk = ids[i : i + 500]
            marks = ",".join("?" * len(chunk))
            async with self.conn.execute(
                f"SELECT external_id FROM seen WHERE source = ? AND external_id IN ({marks})", (source, *chunk)
            ) as cur:
                seen.update(row["external_id"] for row in await cur.fetchall())
        return set(ids) - seen

    async def add_seen(
        self, order: Order, state: str, *, reason: str = "", payload: dict | None = None, commit: bool = True
    ) -> bool:
        """Запоминает заказ. True — заказ новый, False — уже встречался."""
        cur = await self.conn.execute(
            "INSERT OR IGNORE INTO seen (source, external_id, title, url, first_seen, state, reason, payload)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (order.source, order.external_id, order.title[:500], order.url[:1000], _iso(utcnow()), state,
             reason[:300], json.dumps(payload, ensure_ascii=False) if payload is not None else None),
        )
        if commit:
            await self.conn.commit()
        return cur.rowcount == 1

    async def commit(self) -> None:
        await self.conn.commit()

    async def set_state(self, source: str, external_id: str, state: str) -> None:
        sent_at = _iso(utcnow()) if state == STATE_SENT else None
        await self.conn.execute(
            "UPDATE seen SET state = ?, sent_at = COALESCE(?, sent_at) WHERE source = ? AND external_id = ?",
            (state, sent_at, source, external_id),
        )
        await self.conn.commit()

    async def pending(self, since: datetime) -> list[tuple[str, str, dict]]:
        """Подходящие заказы, которые не успели отправить (например, программу закрыли)."""
        async with self.conn.execute(
            "SELECT source, external_id, payload FROM seen WHERE state = ? AND first_seen >= ?"
            " AND payload IS NOT NULL ORDER BY first_seen",
            (STATE_QUEUED, _iso(since)),
        ) as cur:
            rows = await cur.fetchall()
        return [(row["source"], row["external_id"], json.loads(row["payload"])) for row in rows]

    async def count_state(self, state: str, since: datetime) -> int:
        async with self.conn.execute(
            "SELECT COUNT(*) FROM seen WHERE state = ? AND first_seen >= ?", (state, _iso(since))
        ) as cur:
            row = await cur.fetchone()
        return int(row[0])

    async def prune(self, older_than_days: int = 90) -> int:
        cutoff = _iso(utcnow() - timedelta(days=older_than_days))
        cur = await self.conn.execute("DELETE FROM seen WHERE first_seen < ?", (cutoff,))
        await self.conn.commit()
        return cur.rowcount

    # --- состояние источников ---------------------------------------------

    async def _ensure_state(self, source: str) -> None:
        await self.conn.execute("INSERT OR IGNORE INTO source_state (source) VALUES (?)", (source,))

    async def is_initialized(self, source: str) -> bool:
        async with self.conn.execute(
            "SELECT initialized FROM source_state WHERE source = ?", (source,)
        ) as cur:
            row = await cur.fetchone()
        return bool(row and row["initialized"])

    async def mark_initialized(self, source: str) -> None:
        await self._ensure_state(source)
        await self.conn.execute("UPDATE source_state SET initialized = 1 WHERE source = ?", (source,))
        await self.conn.commit()

    async def record_success(self, source: str, count: int) -> None:
        now = _iso(utcnow())
        await self._ensure_state(source)
        await self.conn.execute(
            "UPDATE source_state SET last_run = ?, last_success = ?, last_count = ? WHERE source = ?",
            (now, now, count, source),
        )
        await self.conn.commit()

    async def record_error(self, source: str, error: str) -> None:
        now = _iso(utcnow())
        await self._ensure_state(source)
        await self.conn.execute(
            "UPDATE source_state SET last_run = ?, last_error = ?, last_error_at = ? WHERE source = ?",
            (now, error[:1000], now, source),
        )
        await self.conn.commit()

    async def source_states(self) -> dict[str, SourceState]:
        async with self.conn.execute("SELECT * FROM source_state") as cur:
            rows = await cur.fetchall()
        return {
            row["source"]: SourceState(
                source=row["source"],
                initialized=bool(row["initialized"]),
                last_run=parse_ts(row["last_run"]),
                last_success=parse_ts(row["last_success"]),
                last_count=row["last_count"],
                last_error=row["last_error"],
                last_error_at=parse_ts(row["last_error_at"]),
            )
            for row in rows
        }

    # --- статистика ---------------------------------------------------------

    async def stats(self, since: datetime) -> dict[str, SourceStats]:
        """Найдено новых (без первичной разметки) / подходящих / отправлено с момента since."""
        since_s = _iso(since)
        result: dict[str, SourceStats] = {}
        matched_states = ",".join(f"'{s}'" for s in MATCHED_STATES)
        async with self.conn.execute(
            "SELECT source, COUNT(*) AS found,"
            f" SUM(CASE WHEN state IN ({matched_states}) THEN 1 ELSE 0 END) AS matched"
            " FROM seen WHERE first_seen >= ? AND state != ? GROUP BY source",
            (since_s, STATE_BASELINE),
        ) as cur:
            for row in await cur.fetchall():
                result[row["source"]] = SourceStats(found=row["found"], matched=row["matched"] or 0)
        async with self.conn.execute(
            "SELECT source, COUNT(*) AS sent FROM seen WHERE sent_at >= ? GROUP BY source", (since_s,)
        ) as cur:
            for row in await cur.fetchall():
                result.setdefault(row["source"], SourceStats()).sent = row["sent"]
        return result

    # --- флаги --------------------------------------------------------------

    async def get_flag(self, key: str, default: str | None = None) -> str | None:
        async with self.conn.execute("SELECT value FROM kv WHERE key = ?", (key,)) as cur:
            row = await cur.fetchone()
        return row["value"] if row else default

    async def set_flag(self, key: str, value: str) -> None:
        await self.conn.execute(
            "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )
        await self.conn.commit()
