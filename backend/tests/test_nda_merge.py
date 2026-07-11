from __future__ import annotations

from app.chat_schemas import (
    ConfidentialityTermPatch,
    MndaTermPatch,
    NdaForm,
    NdaPatch,
    PartyPatch,
)
from app.nda_merge import merge_patch


def base_form() -> NdaForm:
    return NdaForm.model_validate(
        {
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
    )


def test_empty_patch_changes_nothing():
    form = base_form()
    merged = merge_patch(form, NdaPatch())
    assert merged == form


def test_text_fields_overwrite():
    merged = merge_patch(
        base_form(),
        NdaPatch(purpose="Joint venture evaluation", governingLaw="Delaware"),
    )
    assert merged.purpose == "Joint venture evaluation"
    assert merged.governingLaw == "Delaware"
    assert merged.jurisdiction == ""


def test_valid_date_applied():
    merged = merge_patch(base_form(), NdaPatch(effectiveDate="2026-09-01"))
    assert merged.effectiveDate == "2026-09-01"


def test_invalid_date_dropped():
    merged = merge_patch(base_form(), NdaPatch(effectiveDate="next Tuesday"))
    assert merged.effectiveDate == "2026-07-11"


def test_term_switch_to_until_terminated_strips_years():
    merged = merge_patch(
        base_form(),
        NdaPatch(mndaTerm=MndaTermPatch(type="untilTerminated", years=3)),
    )
    assert merged.mndaTerm.model_dump() == {"type": "untilTerminated"}


def test_term_years_clamped_to_one():
    merged = merge_patch(
        base_form(),
        NdaPatch(mndaTerm=MndaTermPatch(type="expires", years=0)),
    )
    assert merged.mndaTerm.model_dump() == {"type": "expires", "years": 1}


def test_years_only_patch_keeps_current_type():
    merged = merge_patch(base_form(), NdaPatch(mndaTerm=MndaTermPatch(years=5)))
    assert merged.mndaTerm.model_dump() == {"type": "expires", "years": 5}


def test_years_only_patch_ignored_when_term_has_no_years():
    form = merge_patch(
        base_form(),
        NdaPatch(mndaTerm=MndaTermPatch(type="untilTerminated")),
    )
    merged = merge_patch(form, NdaPatch(mndaTerm=MndaTermPatch(years=5)))
    assert merged.mndaTerm.model_dump() == {"type": "untilTerminated"}


def test_confidentiality_perpetuity():
    merged = merge_patch(
        base_form(),
        NdaPatch(confidentialityTerm=ConfidentialityTermPatch(type="perpetuity")),
    )
    assert merged.confidentialityTerm.model_dump() == {"type": "perpetuity"}


def test_party_partial_update_leaves_other_fields_and_party():
    form = merge_patch(
        base_form(),
        NdaPatch(party1=PartyPatch(name="Jane Doe", company="Acme, Inc.")),
    )
    merged = merge_patch(form, NdaPatch(party1=PartyPatch(title="CEO")))
    assert merged.party1.model_dump() == {
        "name": "Jane Doe",
        "title": "CEO",
        "company": "Acme, Inc.",
        "noticeAddress": "",
    }
    assert merged.party2.model_dump() == {
        "name": "",
        "title": "",
        "company": "",
        "noticeAddress": "",
    }
