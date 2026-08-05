"""Pydantic models for company-level intelligence and report payloads."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class CompanyRunRequest(BaseModel):
    """User input needed to trigger a IntelBox run.

    Beyond company and category, the caller controls the scope of the run:
    how hard to look, whether people matter for this task, and whether a
    cached profile may be used at all.
    """

    company: str = Field(min_length=1)
    category: str = Field(min_length=1)
    depth: Literal["quick", "standard", "deep"] = "standard"
    # When false, linkedin_search isn't offered to the agent at all -- a tool it
    # can't see is a tool it can't waste a call on.
    find_people: bool = True
    # Bypass the cache and research again even if a fresh profile exists.
    force_refresh: bool = False


class SourceRecord(BaseModel):
    """Normalized citation used across tool and report outputs."""

    title: str | None = None
    url: HttpUrl | None = None
    note: str | None = None


class CompanyProfile(BaseModel):
    """Cached company summary stored in MongoDB."""

    company_id: str
    company_name: str
    category: str
    business_model: str
    scale: str
    positioning: str
    market_perception: str
    overview_summary: str
    sources: list[SourceRecord] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_run: datetime = Field(default_factory=datetime.utcnow)


class BrandActivityItem(BaseModel):
    """A single observable campaign, launch, or PR event."""

    title: str
    activity_type: str
    summary: str
    happened_at: datetime | None = None
    source: SourceRecord | None = None


class BrandActivityRecord(BaseModel):
    """Company brand activity collection record."""

    company_id: str
    company_name: str
    activities: list[BrandActivityItem] = Field(default_factory=list)
    fetched_window_months: int = 24
    last_run: datetime = Field(default_factory=datetime.utcnow)


class ReportRecord(BaseModel):
    """Assembled report returned to the frontend and optionally cached."""

    company_id: str
    company_name: str
    category: str
    report_markdown: str
    campaign_playbook_markdown: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
