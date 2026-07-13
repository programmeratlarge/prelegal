"""Integrity checks for registry/documents.json against the templates.

These are the drift guards that make the hand-curated registry safe: every
span the registry claims must exist in its template, and every *_link span in
a template must be claimed by exactly one role or field of its registry
entry.
"""

from __future__ import annotations

import re

import pytest

from app import registry
from app.registry import REGISTRY_PATH

TEMPLATES_DIR = REGISTRY_PATH.parent.parent / "templates"

SPAN_RE = re.compile(
    r'<span class="(?:coverpage_link|orderform_link|keyterms_link|sow_link|'
    r'businessterms_link)"(?:\s+id="[^"]*")?>(.*?)</span>'
)


def normalize_label(raw: str) -> str:
    straight = raw.replace("’", "'").strip()
    return straight[:-2] if straight.endswith("'s") else straight


def template_labels(definition) -> set[str]:
    text = (TEMPLATES_DIR / definition.templateFile).read_text("utf-8")
    return {normalize_label(match) for match in SPAN_RE.findall(text)}


def registry_labels(definition) -> list[str]:
    labels = [label for role in definition.roles for label in role.spanLabels]
    labels += [label for field in definition.fields for label in field.spanLabels]
    return labels


all_documents = registry.load_registry().documentTypes


def test_document_ids_are_unique():
    ids = registry.list_document_ids()
    assert len(ids) == len(set(ids))


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_template_file_exists(definition):
    assert (TEMPLATES_DIR / definition.templateFile).is_file()


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_every_registry_span_label_occurs_in_template(definition):
    missing = set(registry_labels(definition)) - template_labels(definition)
    assert not missing, f"registry labels not found in template: {sorted(missing)}"


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_every_template_span_is_covered_by_registry(definition):
    uncovered = template_labels(definition) - set(registry_labels(definition))
    assert not uncovered, f"template spans missing from registry: {sorted(uncovered)}"


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_span_labels_are_unambiguous(definition):
    labels = registry_labels(definition)
    assert len(labels) == len(set(labels)), "a span label is claimed twice"


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_field_ids_are_unique_and_shapes_are_complete(definition):
    ids = [field.id for field in definition.fields]
    assert len(ids) == len(set(ids))
    assert len(definition.roles) == 2
    for field in definition.fields:
        if field.kind == "choice":
            assert field.options, f"{field.id}: choice field without options"
        if field.kind == "term":
            assert field.variants, f"{field.id}: term field without variants"


@pytest.mark.parametrize("definition", all_documents, ids=lambda d: d.id)
def test_structured_outputs_model_builds(definition):
    from app import patch_models

    model = patch_models.build_chat_turn_model(definition)
    schema = str(model.model_json_schema())
    assert "additionalProperties" not in schema or "True" not in schema
