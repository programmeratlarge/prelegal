"""Wire and LLM schemas for the NDA chat endpoint.

The full-form models mirror frontend/src/lib/ndaSchema.ts exactly (field
names included) so the same JSON flows browser -> API -> browser untouched.
The patch models are what the LLM fills via Structured Outputs: every field
is optional, and only fields the user's latest message provided should be
set.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class PartyInfo(BaseModel):
    name: str = ""
    title: str = ""
    company: str = ""
    noticeAddress: str = ""


class MndaTermExpires(BaseModel):
    type: Literal["expires"]
    years: int


class MndaTermUntilTerminated(BaseModel):
    type: Literal["untilTerminated"]


MndaTerm = Annotated[
    MndaTermExpires | MndaTermUntilTerminated, Field(discriminator="type")
]


class ConfidentialityTermYears(BaseModel):
    type: Literal["years"]
    years: int


class ConfidentialityTermPerpetuity(BaseModel):
    type: Literal["perpetuity"]


ConfidentialityTerm = Annotated[
    ConfidentialityTermYears | ConfidentialityTermPerpetuity,
    Field(discriminator="type"),
]


class NdaForm(BaseModel):
    purpose: str = ""
    effectiveDate: str = ""
    mndaTerm: MndaTerm
    confidentialityTerm: ConfidentialityTerm
    governingLaw: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: PartyInfo = PartyInfo()
    party2: PartyInfo = PartyInfo()


class PartyPatch(BaseModel):
    name: str | None = None
    title: str | None = None
    company: str | None = None
    noticeAddress: str | None = None


class MndaTermPatch(BaseModel):
    type: Literal["expires", "untilTerminated"] | None = None
    years: int | None = None


class ConfidentialityTermPatch(BaseModel):
    type: Literal["years", "perpetuity"] | None = None
    years: int | None = None


class NdaPatch(BaseModel):
    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTerm: MndaTermPatch | None = None
    confidentialityTerm: ConfidentialityTermPatch | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: PartyPatch | None = None
    party2: PartyPatch | None = None


class ChatTurn(BaseModel):
    """The Structured Outputs response format for one chat turn."""

    reply: str
    patch: NdaPatch


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    documentType: Literal["mutual-nda"]
    messages: list[ChatMessage] = Field(min_length=1)
    form: NdaForm


class ChatResponse(BaseModel):
    reply: str
    form: NdaForm
