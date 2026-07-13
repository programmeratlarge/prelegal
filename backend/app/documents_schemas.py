"""Wire schemas for the documents API.

A saved document is a full snapshot of the creator's client state —
documentType + flat form map + chat transcript — exactly the shapes that
already flow through the chat API, so save/resume round-trips untouched.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app import registry
from app.schemas import ChatMessage


class DocumentSaveRequest(BaseModel):
    documentType: str
    form: dict[str, str] = Field(default_factory=dict)
    messages: list[ChatMessage] = Field(default_factory=list)

    @field_validator("documentType")
    @classmethod
    def _known_document(cls, value: str) -> str:
        if value not in registry.list_document_ids():
            raise ValueError(f"Unknown documentType: {value}")
        return value


class DocumentSummary(BaseModel):
    id: int
    documentType: str
    title: str
    createdAt: str
    updatedAt: str


class DocumentDetail(DocumentSummary):
    form: dict[str, str]
    messages: list[ChatMessage]
