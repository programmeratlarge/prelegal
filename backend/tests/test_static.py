from __future__ import annotations


def test_root_serves_static_index(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "FIXTURE_HOME" in response.text


def test_login_route_serves_static_login_page(client):
    response = client.get("/login/")
    assert response.status_code == 200
    assert "FIXTURE_LOGIN" in response.text


def test_unknown_static_path_is_404(client):
    response = client.get("/does-not-exist/")
    assert response.status_code == 404


def test_api_routes_are_not_shadowed_by_static_mount(client):
    response = client.get("/api/me")
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/json")


def test_documents_api_is_not_shadowed_by_static_mount(client):
    response = client.get("/api/documents")
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/json")


def test_documents_route_serves_static_page(client):
    response = client.get("/documents/")
    assert response.status_code == 200
    assert "FIXTURE_DOCUMENTS" in response.text
