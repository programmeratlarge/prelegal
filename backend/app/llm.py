"""LLM access for the document chat, via LiteLLM -> OpenRouter -> Cerebras.

OPENROUTER_API_KEY is read from the environment by litellm (loaded from the
root .env by app.config at import time, or injected by `docker run
--env-file`).
"""

from __future__ import annotations

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def call_chat_llm(
    messages: list[dict], response_format: type[BaseModel]
) -> BaseModel:
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=response_format,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    return response_format.model_validate_json(response.choices[0].message.content)
