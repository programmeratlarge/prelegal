"""Dynamically built Structured Outputs models, one per document type.

Each document gets its own ChatTurn model whose `patch` enumerates exactly
that document's fields with properly constrained types (Literal choices,
term variants, party sub-objects). The LLM therefore cannot invent field
names or out-of-range choice values — anything it returns validates against
the registry by construction. Models are cached per document id.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, create_model

from app import registry
from app.registry.models import DocumentDefinition, FieldDefinition


class PartyPatch(BaseModel):
    name: str | None = None
    title: str | None = None
    company: str | None = None
    noticeAddress: str | None = None


def _field_annotation(field: FieldDefinition) -> tuple[type, object]:
    if field.kind == "choice":
        return (Literal[tuple(field.options)] | None, None)
    if field.kind == "term":
        term_model = create_model(
            f"TermPatch_{field.id}",
            variant=(Literal[tuple(v.id for v in field.variants)] | None, None),
            years=(int | None, None),
        )
        return (term_model | None, None)
    return (str | None, None)


def _document_type_annotation() -> tuple[type, object]:
    return (Literal[tuple(registry.list_document_ids())] | None, None)


_turn_model_cache: dict[str | None, type[BaseModel]] = {}


def build_chat_turn_model(definition: DocumentDefinition | None) -> type[BaseModel]:
    """ChatTurn for one document (or the no-document-selected state).

    Before a document is chosen the patch only accepts party info, so a
    first message like "an NDA between Acme and Beta" both selects the
    document and captures the parties.
    """
    key = definition.id if definition else None
    if key in _turn_model_cache:
        return _turn_model_cache[key]

    patch_fields: dict[str, tuple] = {
        "party1": (PartyPatch | None, None),
        "party2": (PartyPatch | None, None),
    }
    if definition is not None:
        for field in definition.fields:
            patch_fields[field.id] = _field_annotation(field)

    patch_model = create_model(f"Patch_{key or 'unselected'}", **patch_fields)
    turn_model = create_model(
        f"ChatTurn_{key or 'unselected'}",
        reply=(str, ...),
        documentType=_document_type_annotation(),
        patch=(patch_model | None, None),
    )
    _turn_model_cache[key] = turn_model
    return turn_model
