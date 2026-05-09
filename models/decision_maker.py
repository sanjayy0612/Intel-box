"""Pydantic models for people records and contact intelligence."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class DecisionMaker(BaseModel):
    """Stakeholder profile used for outreach personalization."""

    person_id: str
    company_id: str
    company_name: str
    name: str
    title: str
    seniority_level: str
    role_relevance_score: float = Field(ge=0, le=1)
    department: str | None = None
    linkedin_url: HttpUrl | None = None
    snippet: str | None = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class ContactIntelligence(BaseModel):
    """Enriched contact record linked to a decision maker."""

    person_id: str
    email: str | None = None
    linkedin_url: HttpUrl | None = None
    phone: str | None = None
    source: str
    confidence_score: float = Field(ge=0, le=1)
    last_verified: datetime = Field(default_factory=datetime.utcnow)
