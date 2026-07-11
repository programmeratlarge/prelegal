"""Merge an LLM-produced patch onto the client's current NDA form.

The merge is deliberately conservative: invalid values are dropped rather
than erroring, matching the frontend's tolerance (e.g. a malformed date just
renders as "[Today's date]" there). Years are clamped to >= 1, mirroring the
manual form's input clamp in NdaForm.tsx.
"""

from __future__ import annotations

import re

from app.chat_schemas import (
    ConfidentialityTermPatch,
    MndaTermPatch,
    NdaForm,
    NdaPatch,
)

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")

_TEXT_FIELDS = ("purpose", "governingLaw", "jurisdiction", "modifications")


def _merge_term(
    current: dict,
    patch: MndaTermPatch | ConfidentialityTermPatch,
    years_type: str,
    no_years_type: str,
) -> dict:
    term_type = patch.type or current["type"]
    if term_type == years_type:
        years = patch.years if patch.years is not None else current.get("years", 1)
        return {"type": years_type, "years": max(1, int(years))}
    return {"type": no_years_type}


def merge_patch(form: NdaForm, patch: NdaPatch) -> NdaForm:
    data = form.model_dump()

    for field in _TEXT_FIELDS:
        value = getattr(patch, field)
        if value is not None:
            data[field] = value

    if patch.effectiveDate is not None and DATE_RE.fullmatch(patch.effectiveDate):
        data["effectiveDate"] = patch.effectiveDate

    if patch.mndaTerm is not None:
        data["mndaTerm"] = _merge_term(
            data["mndaTerm"], patch.mndaTerm, "expires", "untilTerminated"
        )

    if patch.confidentialityTerm is not None:
        data["confidentialityTerm"] = _merge_term(
            data["confidentialityTerm"], patch.confidentialityTerm, "years", "perpetuity"
        )

    for party_key in ("party1", "party2"):
        party_patch = getattr(patch, party_key)
        if party_patch is not None:
            data[party_key] = {
                **data[party_key],
                **party_patch.model_dump(exclude_none=True),
            }

    return NdaForm.model_validate(data)
