from __future__ import annotations

from app import form_merge, patch_models, registry

NDA = registry.get_document("mutual-nda")
CSA = registry.get_document("cloud-service-agreement")


def nda_patch(**data):
    model = patch_models.build_chat_turn_model(NDA)
    return model.model_validate({"reply": "x", "patch": data}).patch


def test_merge_text_and_party_fields():
    form = NDA.default_form()
    merged = form_merge.merge_patch(
        NDA,
        form,
        nda_patch(governingLaw="Delaware", party1={"company": "Acme, Inc."}),
    )
    assert merged["governingLaw"] == "Delaware"
    assert merged["party1.company"] == "Acme, Inc."
    # Untouched values survive.
    assert merged["purpose"] == form["purpose"]


def test_merge_party_is_partial():
    form = NDA.default_form()
    form["party1.name"] = "Jane Doe"
    merged = form_merge.merge_patch(NDA, form, nda_patch(party1={"title": "CEO"}))
    assert merged["party1.name"] == "Jane Doe"
    assert merged["party1.title"] == "CEO"


def test_merge_rejects_malformed_date():
    form = NDA.default_form()
    original = form["effectiveDate"]
    merged = form_merge.merge_patch(NDA, form, nda_patch(effectiveDate="next Tuesday"))
    assert merged["effectiveDate"] == original


def test_merge_accepts_valid_date():
    merged = form_merge.merge_patch(
        NDA, NDA.default_form(), nda_patch(effectiveDate="2026-08-01")
    )
    assert merged["effectiveDate"] == "2026-08-01"


def test_merge_term_clamps_years():
    merged = form_merge.merge_patch(
        NDA,
        NDA.default_form(),
        nda_patch(mndaTerm={"variant": "expires", "years": 0}),
    )
    assert merged["mndaTerm.variant"] == "expires"
    assert merged["mndaTerm.years"] == "1"


def test_merge_term_switches_variant():
    merged = form_merge.merge_patch(
        NDA,
        NDA.default_form(),
        nda_patch(mndaTerm={"variant": "untilTerminated"}),
    )
    assert merged["mndaTerm.variant"] == "untilTerminated"


def test_merge_none_patch_normalizes_to_registry_keys():
    merged = form_merge.merge_patch(NDA, {"bogusKey": "x", "governingLaw": "Ohio"}, None)
    assert "bogusKey" not in merged
    assert merged["governingLaw"] == "Ohio"
    assert merged["purpose"] == NDA.default_form()["purpose"]


def test_carry_over_keeps_shared_and_drops_specific():
    old = NDA.default_form()
    old["party2.company"] = "Beta LLC"
    old["governingLaw"] = "Delaware"
    carried = form_merge.carry_over(old, CSA)
    assert carried["party2.company"] == "Beta LLC"
    assert carried["governingLaw"] == "Delaware"
    assert "mndaTerm.variant" not in carried
    assert carried["subscriptionPeriod"] == ""


def test_carry_over_does_not_copy_empty_strings_over_defaults():
    old = {"purpose": ""}
    carried = form_merge.carry_over(old, NDA)
    assert carried["purpose"] == NDA.default_form()["purpose"]


def test_carry_over_drops_values_invalid_for_target_kind():
    old = CSA.default_form()
    old["paymentProcess"] = "whatever the parties agree"  # not one of the options
    old["effectiveDate"] = "sometime soon"  # not a date
    carried = form_merge.carry_over(old, CSA)
    assert carried["paymentProcess"] == ""
    assert carried["effectiveDate"] == CSA.default_form()["effectiveDate"]


def test_merge_rejects_choice_value_outside_options():
    csa_patch_model = patch_models.build_chat_turn_model(CSA)
    # Simulate a switch turn: the patch was built against a document whose
    # field of the same id allowed other values (constructed directly here
    # since typed models forbid it).
    class LoosePatch:
        paymentProcess = "net 30"

        def __getattr__(self, name):
            return None

    merged = form_merge.merge_patch(CSA, CSA.default_form(), LoosePatch())
    assert merged["paymentProcess"] == ""
    assert csa_patch_model  # typed model still builds for the same document
