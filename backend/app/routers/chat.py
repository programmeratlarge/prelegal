from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app import llm
from app.chat_schemas import ChatRequest, ChatResponse
from app.deps import get_current_user
from app.nda_merge import merge_patch
from app.schemas import UserPublic

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    user: UserPublic = Depends(get_current_user),
) -> ChatResponse:
    messages = [
        {"role": "system", "content": llm.build_system_prompt(payload.form)},
        *(message.model_dump() for message in payload.messages),
    ]

    try:
        turn = llm.call_chat_llm(messages)
    except Exception:
        logger.exception("Chat LLM call failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "AI service unavailable, please try again."
        )

    merged = merge_patch(payload.form, turn.patch)
    # The model occasionally returns an empty reply alongside a valid patch;
    # never surface an empty chat bubble.
    reply = turn.reply.strip() or "Noted — what would you like to fill in next?"
    return ChatResponse(reply=reply, form=merged)
