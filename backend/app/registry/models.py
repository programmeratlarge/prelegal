"""Pydantic models for the document registry (registry/documents.json).

The registry is the single source of truth for every supported document type:
its template file, party roles, and fillable fields. The frontend loads the
same JSON at build time (frontend/src/lib/registry/), so these models and the
TS types there must describe the same shape.

Forms are flat string maps on the wire. A field's form keys are:
- text/date/money/choice: the field id itself, e.g. "governingLaw"
- term: "<id>.variant" and "<id>.years"
- party roles: "<roleId>.name", ".title", ".company", ".noticeAddress"
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

PARTY_SUBFIELDS = ("name", "title", "company", "noticeAddress")

FieldKind = Literal["text", "date", "money", "choice", "term"]


class TermVariant(BaseModel):
    id: str
    label: str
    hasYears: bool
    template: str


class FieldDefinition(BaseModel):
    id: str
    kind: FieldKind
    label: str
    guidance: str
    spanLabels: list[str] = Field(default_factory=list)
    multiline: bool = False
    default: str | None = None
    options: list[str] = Field(default_factory=list)
    variants: list[TermVariant] = Field(default_factory=list)


class PartyRole(BaseModel):
    id: str
    label: str
    spanLabels: list[str] = Field(default_factory=list)


class DocumentDefinition(BaseModel):
    id: str
    title: str
    description: str
    templateFile: str
    attribution: str
    roles: list[PartyRole]
    fields: list[FieldDefinition]

    def default_form(self) -> dict[str, str]:
        """Full flat form with every key present (empty string = unset)."""
        form: dict[str, str] = {}
        for role in self.roles:
            for sub in PARTY_SUBFIELDS:
                form[f"{role.id}.{sub}"] = ""
        for field in self.fields:
            if field.kind == "term":
                variant, years = _parse_term_default(field)
                form[f"{field.id}.variant"] = variant
                form[f"{field.id}.years"] = years
            elif field.default == "$today":
                form[field.id] = date.today().isoformat()
            else:
                form[field.id] = field.default or ""
        return form


def _parse_term_default(field: FieldDefinition) -> tuple[str, str]:
    if field.default and ":" in field.default:
        variant, years = field.default.split(":", 1)
        return variant, years
    return field.variants[0].id if field.variants else "", "1"


class DocumentRegistry(BaseModel):
    documentTypes: list[DocumentDefinition]
