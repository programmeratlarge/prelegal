from __future__ import annotations


def signup(client, email="alice@example.com", password="correct-horse"):
    return client.post("/api/signup", json={"email": email, "password": password})


def test_signup_creates_user_and_sets_cookie(client):
    response = signup(client)
    assert response.status_code == 201
    assert response.json()["email"] == "alice@example.com"
    assert "session" in response.cookies


def test_signup_duplicate_email_rejected(client):
    signup(client)
    response = signup(client)
    assert response.status_code == 400


def test_signup_short_password_rejected(client):
    response = signup(client, password="short")
    assert response.status_code == 422


def test_signin_with_correct_credentials(client):
    signup(client)
    client.cookies.clear()
    response = client.post(
        "/api/signin", json={"email": "alice@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 200
    assert "session" in response.cookies


def test_signin_wrong_password_rejected(client):
    signup(client)
    client.cookies.clear()
    response = client.post(
        "/api/signin", json={"email": "alice@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_signin_unknown_email_rejected(client):
    response = client.post(
        "/api/signin", json={"email": "nobody@example.com", "password": "whatever1"}
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/me")
    assert response.status_code == 401


def test_me_returns_current_user_after_signup(client):
    signup(client)
    response = client.get("/api/me")
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_signout_clears_session(client):
    signup(client)
    logout_response = client.post("/api/signout")
    assert logout_response.status_code == 204
    response = client.get("/api/me")
    assert response.status_code == 401


def test_tampered_cookie_is_rejected(client):
    client.cookies.set("session", "not-a-real-token")
    response = client.get("/api/me")
    assert response.status_code == 401
