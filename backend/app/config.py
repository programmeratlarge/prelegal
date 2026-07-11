from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Convenience for local (non-Docker) runs: the .env file lives at the repo
# root. In Docker, env vars are already injected via `docker run --env-file`,
# so this is a no-op there (load_dotenv never overrides existing env vars).
load_dotenv(BACKEND_ROOT.parent / ".env")


@dataclass(frozen=True)
class Settings:
    session_secret: str
    db_path: Path = BACKEND_ROOT / "data" / "app.db"
    static_dir: Path = BACKEND_ROOT / "static"
    cookie_name: str = "session"
    cookie_secure: bool = False
    session_max_age_seconds: int = 60 * 60 * 24 * 14  # 14 days


def load_settings() -> Settings:
    session_secret = os.environ.get("SESSION_SECRET")
    if not session_secret:
        raise RuntimeError(
            "SESSION_SECRET is not set. Add it to the .env file at the project root."
        )
    return Settings(
        session_secret=session_secret,
        cookie_secure=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
    )
