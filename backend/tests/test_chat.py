from __future__ import annotations

import pytest

import app.routers.chat as chat_router
from app.chat_schemas import ChatTurn, NdaPatch


def default_form() -> dict:
    return {
        "purpose": "Evaluating a business relationship.",
        "effectiveDate": "2026-07-11",
        "mndaTerm": {"type": "expires", "years": 1},
        "confidentialityTerm": {"type": "years", "years": 1},
        "governingLaw": "",
        "jurisdiction": "",
        "modifications": "",
        "party1": {"name": "", "title": "", "company": "", "noticeAddress": ""},
        "party2": {"name": "", "title": "", "company": "", "noticeAddress": ""},
    }


def chat_request(**overrides) -> dict:
    payload = {
        "documentType": "mutual-nda",
        "messages": [{"role": "user", "content": "Party 1 is Acme, Inc."}],
        "form": default_form(),
    }
    payload.update(overrides)
    return payload


def signed_in(client):
    client.post(
        "/api/signup",
        json={"email": "chat@example.com", "password": "correct-horse"},
    )
    return client


def test_chat_requires_authentication(client):
    response = client.post("/api/chat", json=chat_request())
    assert response.status_code == 401


def test_chat_merges_patch_and_returns_reply(client, monkeypatch):
    def fake_llm(messages):
        assert messages[0]["role"] == "system"
        assert messages[-1] == {"role": "user", "content": "Party 1 is Acme, Inc."}
        return ChatTurn(
            reply="Got it — Acme, Inc. is Party 1. Who is Party 2?",
            patch=NdaPatch.model_validate({"party1": {"company": "Acme, Inc."}}),
        )

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 200
    body = response.json()
    assert body["reply"].startswith("Got it")
    assert body["form"]["party1"]["company"] == "Acme, Inc."
    assert body["form"]["purpose"] == "Evaluating a business relationship."


def test_chat_empty_reply_gets_fallback_text(client, monkeypatch):
    def fake_llm(messages):
        return ChatTurn(reply="  ", patch=NdaPatch())

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 200
    assert response.json()["reply"].strip() != ""


def test_chat_llm_failure_returns_502(client, monkeypatch):
    def failing_llm(messages):
        raise RuntimeError("provider exploded")

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", failing_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 502
    assert "AI service unavailable" in response.json()["detail"]


def test_chat_rejects_unknown_document_type(client):
    response = signed_in(client).post(
        "/api/chat", json=chat_request(documentType="cloud-service-agreement")
    )
    assert response.status_code == 422


def test_chat_rejects_empty_messages(client):
    response = signed_in(client).post("/api/chat", json=chat_request(messages=[]))
    assert response.status_code == 422


@pytest.mark.parametrize("field", ["messages", "form", "documentType"])
def test_chat_rejects_missing_fields(client, field):
    payload = chat_request()
    del payload[field]
    response = signed_in(client).post("/api/chat", json=payload)
    assert response.status_code == 422
