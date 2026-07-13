"""Wire schemas for the chat endpoint.

The form is a flat string map (see app.registry.models for the key
conventions) that mirrors the frontend's representation exactly, so the same
JSON flows browser -> API -> browser untouched. The LLM-facing Structured
Outputs models are built per document type in app.patch_models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app import registry
from app.schemas import ChatMessage

__all__ = ["ChatMessage", "ChatRequest", "ChatResponse"]


class ChatRequest(BaseModel):
    documentType: str | None = None
    messages: list[ChatMessage] = Field(min_length=1)
    form: dict[str, str] = Field(default_factory=dict)

    @field_validator("documentType")
    @classmethod
    def _known_document(cls, value: str | None) -> str | None:
        if value is not None and value not in registry.list_document_ids():
            raise ValueError(f"Unknown documentType: {value}")
        return value


class ChatResponse(BaseModel):
    reply: str
    documentType: str | None
    form: dict[str, str]
