from __future__ import annotations

import pytest

import app.routers.chat as chat_router
from app import patch_models, registry


def nda_form() -> dict:
    form = registry.get_document("mutual-nda").default_form()
    form["purpose"] = "Evaluating a business relationship."
    form["effectiveDate"] = "2026-07-11"
    return form


def chat_request(**overrides) -> dict:
    payload = {
        "documentType": "mutual-nda",
        "messages": [{"role": "user", "content": "Party 1 is Acme, Inc."}],
        "form": nda_form(),
    }
    payload.update(overrides)
    return payload


def fake_turn(document_id: str | None, **data):
    definition = registry.get_document(document_id) if document_id else None
    return patch_models.build_chat_turn_model(definition).model_validate(data)


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
    def fake_llm(messages, response_format):
        assert messages[0]["role"] == "system"
        assert messages[-1] == {"role": "user", "content": "Party 1 is Acme, Inc."}
        return fake_turn(
            "mutual-nda",
            reply="Got it — Acme, Inc. is Party 1. Who is Party 2?",
            patch={"party1": {"company": "Acme, Inc."}},
        )

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 200
    body = response.json()
    assert body["reply"].startswith("Got it")
    assert body["documentType"] == "mutual-nda"
    assert body["form"]["party1.company"] == "Acme, Inc."
    assert body["form"]["purpose"] == "Evaluating a business relationship."


def test_chat_empty_reply_gets_fallback_text(client, monkeypatch):
    def fake_llm(messages, response_format):
        return fake_turn("mutual-nda", reply="  ")

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 200
    assert response.json()["reply"].strip() != ""


def test_chat_llm_failure_returns_502(client, monkeypatch):
    def failing_llm(messages, response_format):
        raise RuntimeError("provider exploded")

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", failing_llm)

    response = signed_in(client).post("/api/chat", json=chat_request())
    assert response.status_code == 502
    assert "AI service unavailable" in response.json()["detail"]


def test_chat_rejects_unknown_document_type(client):
    response = signed_in(client).post(
        "/api/chat", json=chat_request(documentType="employment-contract")
    )
    assert response.status_code == 422


@pytest.mark.parametrize("document_id", registry.list_document_ids())
def test_chat_accepts_every_catalog_document_type(client, monkeypatch, document_id):
    def fake_llm(messages, response_format):
        return fake_turn(document_id, reply="Let's get started.")

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post(
        "/api/chat",
        json=chat_request(
            documentType=document_id,
            form=registry.get_document(document_id).default_form(),
        ),
    )
    assert response.status_code == 200
    assert response.json()["documentType"] == document_id


def test_chat_first_turn_selects_document(client, monkeypatch):
    def fake_llm(messages, response_format):
        return fake_turn(
            None,
            reply="Great, a Mutual NDA it is. Who are the parties?",
            documentType="mutual-nda",
            patch={"party1": {"company": "Acme, Inc."}},
        )

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post(
        "/api/chat",
        json={
            "documentType": None,
            "messages": [{"role": "user", "content": "I need an NDA for Acme"}],
            "form": {},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "mutual-nda"
    assert body["form"]["party1.company"] == "Acme, Inc."
    # A selected document's form is fully populated with defaults.
    assert "mndaTerm.variant" in body["form"]


def test_chat_no_selection_passes_form_through(client, monkeypatch):
    def fake_llm(messages, response_format):
        return fake_turn(
            None,
            reply="We can't draft an employment contract, but the closest match is...",
        )

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    response = signed_in(client).post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "I need an employment contract"}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] is None
    assert body["form"] == {}


def test_chat_switch_carries_shared_fields(client, monkeypatch):
    def fake_llm(messages, response_format):
        return fake_turn(
            "mutual-nda",
            reply="Switching to a Cloud Service Agreement.",
            documentType="cloud-service-agreement",
        )

    monkeypatch.setattr(chat_router.llm, "call_chat_llm", fake_llm)

    form = nda_form()
    form["party1.company"] = "Acme, Inc."
    form["governingLaw"] = "Delaware"
    response = signed_in(client).post("/api/chat", json=chat_request(form=form))
    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "cloud-service-agreement"
    # Party info and shared field ids carry over; NDA-only fields are gone.
    assert body["form"]["party1.company"] == "Acme, Inc."
    assert body["form"]["governingLaw"] == "Delaware"
    assert "subscriptionPeriod" in body["form"]
    assert "mndaTerm.variant" not in body["form"]


def test_chat_rejects_empty_messages(client):
    response = signed_in(client).post("/api/chat", json=chat_request(messages=[]))
    assert response.status_code == 422


def test_chat_rejects_missing_messages(client):
    payload = chat_request()
    del payload["messages"]
    response = signed_in(client).post("/api/chat", json=payload)
    assert response.status_code == 422
