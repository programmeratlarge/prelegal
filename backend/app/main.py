from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import Settings, load_settings
from app.db import init_db
from app.registry import load_registry
from app.routers import auth, chat, documents


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.db = init_db(settings)
        # Fail fast on a missing/invalid registry (e.g. a broken Docker COPY)
        # instead of surfacing it on the first chat request.
        load_registry()
        yield
        app.state.db.connection.close()

    app = FastAPI(title="Prelegal API", lifespan=lifespan)

    # API routers are registered before the static mount below so that
    # /api/* always matches an explicit route instead of falling through to
    # the StaticFiles catch-all.
    app.include_router(auth.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")

    if settings.static_dir.exists():
        app.mount(
            "/",
            StaticFiles(directory=settings.static_dir, html=True),
            name="static",
        )

    return app


app = create_app()
