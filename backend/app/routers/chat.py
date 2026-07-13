from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app import form_merge, llm, patch_models, registry
from app.chat_schemas import ChatRequest, ChatResponse
from app.deps import get_current_user
from app.registry.prompt import build_system_prompt
from app.schemas import UserPublic

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

FALLBACK_REPLY = "Noted — what would you like to fill in next?"


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    user: UserPublic = Depends(get_current_user),
) -> ChatResponse:
    definition = (
        registry.get_document(payload.documentType) if payload.documentType else None
    )
    messages = [
        {"role": "system", "content": build_system_prompt(definition, payload.form)},
        *(message.model_dump() for message in payload.messages),
    ]

    try:
        turn = llm.call_chat_llm(
            messages, patch_models.build_chat_turn_model(definition)
        )
    except Exception:
        logger.exception("Chat LLM call failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "AI service unavailable, please try again."
        )

    # The model occasionally returns an empty reply alongside a valid patch;
    # never surface an empty chat bubble.
    reply = turn.reply.strip() or FALLBACK_REPLY

    target_id = turn.documentType or (definition.id if definition else None)
    target = registry.get_document(target_id) if target_id else None
    if target is None:
        # Still choosing a document: pass the form through unchanged.
        return ChatResponse(reply=reply, documentType=None, form=payload.form)

    switched = definition is None or target.id != definition.id
    base_form = (
        form_merge.carry_over(payload.form, target) if switched else payload.form
    )
    merged = form_merge.merge_patch(target, base_form, turn.patch)
    return ChatResponse(reply=reply, documentType=target.id, form=merged)
