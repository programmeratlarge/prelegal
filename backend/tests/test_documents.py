from __future__ import annotations

import pytest

from app import registry
from app.documents import derive_title
from tests.conftest import signed_in


def save_payload(**overrides) -> dict:
    payload = {
        "documentType": "mutual-nda",
        "form": {"party1.company": "Acme, Inc.", "party2.company": "Beta LLC"},
        "messages": [
            {"role": "assistant", "content": "Hi! What do you need?"},
            {"role": "user", "content": "An NDA between Acme and Beta"},
        ],
    }
    payload.update(overrides)
    return payload


def create(client, **overrides):
    response = client.post("/api/documents", json=save_payload(**overrides))
    assert response.status_code == 201
    return response.json()


@pytest.mark.parametrize(
    "method,path,needs_body",
    [
        ("GET", "/api/documents", False),
        ("POST", "/api/documents", True),
        ("GET", "/api/documents/1", False),
        ("PUT", "/api/documents/1", True),
        ("DELETE", "/api/documents/1", False),
    ],
)
def test_documents_require_authentication(client, method, path, needs_body):
    response = client.request(method, path, json=save_payload() if needs_body else None)
    assert response.status_code == 401


def test_create_returns_detail_with_derived_title(client):
    body = create(signed_in(client))
    assert body["id"] == 1
    assert body["title"] == "Mutual Non-Disclosure Agreement — Acme, Inc. / Beta LLC"
    assert body["form"]["party1.company"] == "Acme, Inc."
    assert body["messages"][1]["content"] == "An NDA between Acme and Beta"
    assert body["createdAt"] == body["updatedAt"]


def test_create_rejects_unknown_document_type(client):
    response = signed_in(client).post(
        "/api/documents", json=save_payload(documentType="employment-contract")
    )
    assert response.status_code == 422


def test_title_degrades_gracefully_without_parties(client):
    body = create(signed_in(client), form={})
    assert body["title"] == "Mutual Non-Disclosure Agreement"


def test_list_is_scoped_to_current_user_and_ordered(client):
    signed_in(client, "alice@example.com")
    create(client)
    create(client, documentType="pilot-agreement", form={})

    listing = client.get("/api/documents").json()
    assert [d["id"] for d in listing] == [2, 1]
    assert listing[0]["documentType"] == "pilot-agreement"
    # Summaries never include the heavy fields.
    assert "form" not in listing[0] and "messages" not in listing[0]

    client.post("/api/signout")
    signed_in(client, "bob@example.com")
    assert client.get("/api/documents").json() == []


def test_get_returns_full_snapshot(client):
    doc_id = create(signed_in(client))["id"]
    body = client.get(f"/api/documents/{doc_id}").json()
    assert body["form"]["party2.company"] == "Beta LLC"
    assert len(body["messages"]) == 2


def test_unknown_and_foreign_ids_are_the_same_404(client):
    signed_in(client, "alice@example.com")
    doc_id = create(client)["id"]
    missing = client.get("/api/documents/999")

    client.post("/api/signout")
    signed_in(client, "bob@example.com")
    foreign = client.get(f"/api/documents/{doc_id}")

    assert missing.status_code == foreign.status_code == 404
    assert missing.json() == foreign.json()


def test_update_overwrites_snapshot_and_can_change_type(client):
    doc_id = create(signed_in(client))["id"]
    response = client.put(
        f"/api/documents/{doc_id}",
        json=save_payload(
            documentType="pilot-agreement",
            form={"party1.company": "Acme, Inc.", "pilotPeriod": "60 days"},
            messages=[{"role": "assistant", "content": "Switched to a pilot."}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "pilot-agreement"
    assert body["title"] == "Pilot Agreement — Acme, Inc."
    assert body["form"]["pilotPeriod"] == "60 days"
    assert len(body["messages"]) == 1


def test_update_foreign_document_is_404(client):
    signed_in(client, "alice@example.com")
    doc_id = create(client)["id"]
    client.post("/api/signout")
    signed_in(client, "bob@example.com")
    response = client.put(f"/api/documents/{doc_id}", json=save_payload())
    assert response.status_code == 404


def test_delete_removes_document(client):
    doc_id = create(signed_in(client))["id"]
    assert client.delete(f"/api/documents/{doc_id}").status_code == 204
    assert client.get(f"/api/documents/{doc_id}").status_code == 404
    assert client.get("/api/documents").json() == []


def test_delete_unknown_or_foreign_is_404(client):
    signed_in(client, "alice@example.com")
    doc_id = create(client)["id"]
    assert client.delete("/api/documents/999").status_code == 404
    client.post("/api/signout")
    signed_in(client, "bob@example.com")
    assert client.delete(f"/api/documents/{doc_id}").status_code == 404


@pytest.mark.parametrize("document_id", registry.list_document_ids())
def test_save_round_trips_every_document_type(client, document_id):
    definition = registry.get_document(document_id)
    form = definition.default_form()
    body = create(signed_in(client), documentType=document_id, form=form)
    fetched = client.get(f"/api/documents/{body['id']}").json()
    assert fetched["documentType"] == document_id
    assert fetched["form"] == form


def test_derive_title_prefers_company_then_name():
    definition = registry.get_document("cloud-service-agreement")
    assert derive_title(definition, {"party1.name": "Jane Doe"}) == (
        "Cloud Service Agreement — Jane Doe"
    )
    assert derive_title(
        definition, {"party1.name": "Jane Doe", "party1.company": "Acme, Inc."}
    ) == "Cloud Service Agreement — Acme, Inc."
