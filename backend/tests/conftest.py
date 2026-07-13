from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

FIXTURES_STATIC = Path(__file__).parent / "fixtures" / "static"


@pytest.fixture
def client(tmp_path):
    settings = Settings(
        session_secret="test-secret",
        db_path=tmp_path / "test.db",
        static_dir=FIXTURES_STATIC,
    )
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client


def signed_in(client, email: str = "user@example.com"):
    """Sign up a user on this client; TestClient persists the session cookie."""
    client.post("/api/signup", json={"email": email, "password": "correct-horse"})
    return client
