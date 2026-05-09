"""Pydantic models for agent run state and outreach tracking."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TrackerStatus = Literal["drafted", "sent", "opened", "replied"]
RunStatus = Literal["queued", "running", "completed", "failed", "cached"]


class OutreachTrackerEntry(BaseModel):
    """Status log for an outbound touchpoint."""

    tracker_id: str
    person_id: str
    company_id: str
    channel: Literal["email", "linkedin"]
    status: TrackerStatus
    sent_at: datetime | None = None
    opened_at: datetime | None = None
    replied_at: datetime | None = None
    follow_up_due: datetime | None = None
    draft_version: int = 1


class TrackerUpdateRequest(BaseModel):
    """Frontend payload for updating outreach status."""

    tracker_id: str
    status: TrackerStatus
    channel: Literal["email", "linkedin"]


class AgentStep(BaseModel):
    """A discrete progress event exposed to the frontend."""

    key: str
    label: str
    status: Literal["pending", "running", "completed", "failed"]
    detail: str | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentRunRecord(BaseModel):
    """Lifecycle state for a report generation job."""

    run_id: str
    company: str
    category: str
    status: RunStatus
    steps: list[AgentStep] = Field(default_factory=list)
    report_markdown: str | None = None
    campaign_playbook_markdown: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
