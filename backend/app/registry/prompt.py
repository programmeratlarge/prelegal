"""System prompt generation from the document registry.

Replaces the hand-written NDA FIELD_GUIDE: the per-field prose now comes from
each registry entry's label/guidance/kind, so every document gets the same
quality of LLM steering without hand-authored prompts. The catalog summary is
always included (O(n) one-liners); detailed field guidance only for the
active document (O(1) documents' worth of detail per request).
"""

from __future__ import annotations

import json

from app.registry import load_registry
from app.registry.models import DocumentDefinition, FieldDefinition

PARTY_GUIDE = """\
Each party has: name (the printed name of the INDIVIDUAL person signing for \
that party — never a company name), title (that person's job title), company \
(the organization's legal name), and noticeAddress (email or postal address \
for legal notices). If the user gives only an organization name, set company \
and leave name unset."""


def _catalog_summary() -> str:
    lines = [
        f'- "{definition.id}": {definition.title} — {definition.description}'
        for definition in load_registry().documentTypes
    ]
    return "\n".join(lines)


def _field_line(field: FieldDefinition) -> str:
    line = f"- {field.id}: {field.label}. {field.guidance}"
    if field.kind == "date":
        line += " Strictly formatted yyyy-mm-dd."
    elif field.kind == "choice":
        options = ", ".join(f'"{option}"' for option in field.options)
        line += f" One of: {options}."
    elif field.kind == "term":
        variants = "; ".join(
            f'{{"variant": "{variant.id}"' + (', "years": N}' if variant.hasYears else "}")
            + f" = {variant.label}"
            for variant in field.variants
        )
        line += f" Set as {variants}."
    return line


def _selection_rules() -> str:
    return f"""\
Supported documents (id: name — what it covers):
{_catalog_summary()}

Document selection rules:
- Set `documentType` only when the user has clearly asked for one of the \
supported documents (or confirmed a suggestion of yours).
- If the user asks for a document that is NOT on the list (for example an \
employment contract), do not set `documentType`. Explain briefly that you \
can't generate that document, name the closest supported document, and ask \
if they'd like to proceed with it instead.
- If the user wants to switch to a different supported document mid-way, set \
`documentType` to the new id; party details and shared fields carry over \
automatically."""


def build_system_prompt(
    definition: DocumentDefinition | None, form: dict[str, str]
) -> str:
    if definition is None:
        return f"""\
You are a friendly assistant helping a user draft a legal agreement. No \
document has been chosen yet: find out what they need, then set \
`documentType`.

{_selection_rules()}

The two contracting parties are party1 and party2. {PARTY_GUIDE}

Rules:
- In `patch`, set party1/party2 details the user's message already provided \
(e.g. "between Acme Inc and Beta LLC" sets party1.company and \
party2.company); leave everything else null. Never invent or guess values.
- Keep `reply` conversational and concise (1-3 sentences). If asked for \
legal advice, briefly decline and suggest consulting a lawyer."""

    role_lines = "\n".join(
        f"- {role.id}: the {role.label}. {PARTY_GUIDE}" for role in definition.roles
    )
    field_lines = "\n".join(_field_line(field) for field in definition.fields)
    return f"""\
You are a friendly assistant helping a user fill in a {definition.title} \
(based on the Common Paper standard terms). You do this through a short \
conversation: ask one focused question at a time, working through whatever \
required information is still missing, starting with the two parties.

The parties:
{role_lines}

Fields of the {definition.title} (patch keys shown):
{field_lines}

{_selection_rules()}

The form as currently filled in (empty strings mean not yet provided):
{json.dumps(form, indent=2)}

Rules:
- In `patch`, set only fields the user's latest message actually provided or \
changed; leave everything else null. Never invent or guess values.
- If the user gives a relative or ambiguous date, ask them to confirm the \
exact date; dates must be yyyy-mm-dd.
- Do not re-ask about fields that are already filled in above unless the \
user wants to change them.
- Stay on the topic of this agreement. If asked for legal advice, briefly \
decline and suggest consulting a lawyer.
- Keep `reply` conversational and concise (1-3 sentences). End with the next \
question while required fields remain empty; once everything is filled, \
summarize and let the user know they can download the PDF or keep editing."""
