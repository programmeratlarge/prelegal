"""Merge an LLM patch onto a flat form, and carry fields across doc switches.

The merge is deliberately conservative, matching the pre-PL-6 NDA behavior:
invalid values are dropped rather than erroring (a malformed date just leaves
the field unset), and term years are clamped to >= 1. Field names and choice
values are already constrained by the typed patch models (app.patch_models),
so this layer only has to validate free-form values.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

from app.registry.models import PARTY_SUBFIELDS, DocumentDefinition, FieldDefinition

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


def carry_over(old_form: dict[str, str], target: DocumentDefinition) -> dict[str, str]:
    """Start a switched-to document from its defaults, keeping any values the
    old form already collected under the same key (party info, shared field
    ids like effectiveDate/governingLaw)."""
    form = target.default_form()
    for key in form:
        value = old_form.get(key, "")
        if value:
            form[key] = value
    return form


def _merge_term(form: dict[str, str], field: FieldDefinition, patch: BaseModel) -> None:
    if patch.variant is not None:
        form[f"{field.id}.variant"] = patch.variant
    if patch.years is not None:
        form[f"{field.id}.years"] = str(max(1, int(patch.years)))


def _merge_party(form: dict[str, str], role_id: str, patch: BaseModel) -> None:
    for sub in PARTY_SUBFIELDS:
        value = getattr(patch, sub)
        if value is not None:
            form[f"{role_id}.{sub}"] = value


def merge_patch(
    definition: DocumentDefinition,
    form: dict[str, str],
    patch: BaseModel | None,
) -> dict[str, str]:
    merged = definition.default_form()
    merged.update({key: value for key, value in form.items() if key in merged})
    if patch is None:
        return merged

    for role in definition.roles:
        party_patch = getattr(patch, role.id, None)
        if party_patch is not None:
            _merge_party(merged, role.id, party_patch)

    for field in definition.fields:
        value = getattr(patch, field.id, None)
        if value is None:
            continue
        if field.kind == "term":
            _merge_term(merged, field, value)
        elif field.kind == "date":
            if DATE_RE.fullmatch(value):
                merged[field.id] = value
        else:
            merged[field.id] = value

    return merged
