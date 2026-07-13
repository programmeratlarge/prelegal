from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class ChatMessage(BaseModel):
    """One chat-transcript entry; shared by the chat and documents APIs."""

    role: Literal["user", "assistant"]
    content: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    email: str
    created_at: str
