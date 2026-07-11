from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.config import Settings
from app.db import Database, get_db
from app.schemas import UserPublic
from app.security import verify_session_token


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_current_user(
    request: Request,
    db: Database = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserPublic:
    token = request.cookies.get(settings.cookie_name)
    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    user_id = verify_session_token(token, settings.session_secret, settings.session_max_age_seconds)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    with db.lock:
        row = db.connection.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    return UserPublic(id=row["id"], email=row["email"], created_at=row["created_at"])
