"""Loader for the document registry.

The JSON lives at <repo root>/registry/documents.json in dev and at
/registry/documents.json in Docker (see Dockerfile: `COPY registry /registry`
keeps BACKEND_ROOT.parent resolving the same way in both).
"""

from __future__ import annotations

from functools import lru_cache

from app.config import BACKEND_ROOT
from app.registry.models import DocumentDefinition, DocumentRegistry

REGISTRY_PATH = BACKEND_ROOT.parent / "registry" / "documents.json"


@lru_cache(maxsize=1)
def load_registry() -> DocumentRegistry:
    return DocumentRegistry.model_validate_json(REGISTRY_PATH.read_text("utf-8"))


def get_document(document_id: str) -> DocumentDefinition | None:
    for definition in load_registry().documentTypes:
        if definition.id == document_id:
            return definition
    return None


def list_document_ids() -> list[str]:
    return [definition.id for definition in load_registry().documentTypes]
