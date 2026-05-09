"""Pydantic models for competitor intelligence and related storage records."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CompetitorInsight(BaseModel):
    """A single competitor and the signals gathered about it."""

    name: str
    revenue_hint: str | None = None
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    marketing_activity: list[str] = Field(default_factory=list)
    activity_summary: str


class CompetitorMapRecord(BaseModel):
    """Stored competitor mapping for a company."""

    company_id: str
    company_name: str
    category: str
    competitors: list[CompetitorInsight] = Field(default_factory=list)
    shared_competitor_names: list[str] = Field(default_factory=list)
    last_run: datetime = Field(default_factory=datetime.utcnow)
