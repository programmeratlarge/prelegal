"""LLM access for the NDA chat, via LiteLLM -> OpenRouter -> Cerebras.

OPENROUTER_API_KEY is read from the environment by litellm (loaded from the
root .env by app.config at import time, or injected by `docker run
--env-file`).
"""

from __future__ import annotations

import json

from litellm import completion

from app.chat_schemas import ChatTurn, NdaForm

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

FIELD_GUIDE = """\
Fields of the Mutual NDA (patch keys shown in JSON path form):
- purpose: why the parties are exchanging confidential information.
- party1, party2: each has name (the printed name of the INDIVIDUAL person \
signing for that party — never a company name), title (that person's job \
title), company (the organization's legal name), and noticeAddress (email \
or postal address for legal notices). If the user gives only an \
organization name, set company and leave name unset.
- effectiveDate: the date the NDA takes effect, strictly formatted \
yyyy-mm-dd.
- mndaTerm: how long the agreement itself runs. Either \
{"type": "expires", "years": N} or {"type": "untilTerminated"} (continues \
until a party terminates).
- confidentialityTerm: how long confidentiality obligations last after \
disclosure. Either {"type": "years", "years": N} or {"type": "perpetuity"}.
- governingLaw: the US state whose law governs, e.g. "Delaware".
- jurisdiction: where disputes are heard, e.g. "New Castle County, DE".
- modifications: optional free-text modifications to the standard terms; \
leave unset unless the user asks for changes."""


def build_system_prompt(form: NdaForm) -> str:
    return f"""\
You are a friendly assistant helping a user fill in a Mutual Non-Disclosure \
Agreement (based on the Common Paper standard terms). You do this through a \
short conversation: ask one focused question at a time, working through \
whatever required information is still missing, roughly in this order: the \
two parties (names, companies, titles, notice addresses), purpose, effective \
date, MNDA term, term of confidentiality, governing law, and jurisdiction.

{FIELD_GUIDE}

The form as currently filled in (empty strings mean not yet provided):
{json.dumps(form.model_dump(), indent=2)}

Rules:
- In `patch`, set only fields the user's latest message actually provided or \
changed; leave everything else null. Never invent or guess values.
- If the user gives a relative or ambiguous date, ask them to confirm the \
exact date; effectiveDate must be yyyy-mm-dd.
- Do not re-ask about fields that are already filled in above unless the \
user wants to change them.
- Stay on the topic of this NDA. If asked for legal advice, briefly decline \
and suggest consulting a lawyer.
- Keep `reply` conversational and concise (1-3 sentences). End with the next \
question while required fields remain empty; once everything is filled, \
summarize and let the user know they can download the PDF or keep editing.\
"""


def call_chat_llm(messages: list[dict]) -> ChatTurn:
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    return ChatTurn.model_validate_json(response.choices[0].message.content)
