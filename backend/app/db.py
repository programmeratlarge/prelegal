from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass

from fastapi import Request

from app.config import Settings

SCHEMA_SQL = """
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


@dataclass
class Database:
    connection: sqlite3.Connection
    lock: threading.Lock


def init_db(settings: Settings) -> Database:
    """Create a fresh sqlite file and schema, discarding any prior data.

    The database is intentionally ephemeral: it is deleted and recreated
    every time the app starts, per the "temporary database" requirement.
    """
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    if settings.db_path.exists():
        settings.db_path.unlink()

    connection = sqlite3.connect(settings.db_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.executescript(SCHEMA_SQL)
    connection.commit()
    return Database(connection=connection, lock=threading.Lock())


def get_db(request: Request) -> Database:
    return request.app.state.db
