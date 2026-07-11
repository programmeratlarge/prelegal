from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.config import Settings
from app.db import Database, get_db
from app.deps import get_current_user, get_settings
from app.schemas import SigninRequest, SignupRequest, UserPublic
from app.security import create_session_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _set_session_cookie(response: Response, user_id: int, settings: Settings) -> None:
    token = create_session_token(user_id, settings.session_secret)
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=settings.session_max_age_seconds,
        path="/",
    )


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    response: Response,
    db: Database = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserPublic:
    password_hash = hash_password(payload.password)
    with db.lock:
        try:
            cursor = db.connection.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (payload.email, password_hash),
            )
            db.connection.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
        user_id = cursor.lastrowid
        row = db.connection.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()

    _set_session_cookie(response, row["id"], settings)
    return UserPublic(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signin", response_model=UserPublic)
def signin(
    payload: SigninRequest,
    response: Response,
    db: Database = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserPublic:
    with db.lock:
        row = db.connection.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (payload.email,),
        ).fetchone()

    # Always run password verification, even for an unknown email, so the
    # response time doesn't reveal whether the email is registered.
    password_valid = verify_password(payload.password, row["password_hash"] if row else None)
    if row is None or not password_valid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    _set_session_cookie(response, row["id"], settings)
    return UserPublic(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def signout(response: Response, settings: Settings = Depends(get_settings)) -> None:
    response.delete_cookie(key=settings.cookie_name, path="/")


@router.get("/me", response_model=UserPublic)
def me(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return user
