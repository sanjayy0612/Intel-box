"""Pydantic models for outreach drafts and campaign playbooks."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OutreachDraft(BaseModel):
    """Versioned outreach assets for a single person."""

    draft_id: str
    person_id: str
    company_id: str
    linkedin_message: str
    email_subject: str
    email_body: str
    brand_context_used: list[str] = Field(default_factory=list)
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CampaignConcept(BaseModel):
    """A single campaign concept within the campaign playbook."""

    title: str
    audience: str
    channels: list[str] = Field(default_factory=list)
    value_proposition: str
    kpis: list[str] = Field(default_factory=list)


class CampaignPlaybook(BaseModel):
    """Structured campaign playbook rendered as markdown for the report."""

    company_id: str
    company_name: str
    concepts: list[CampaignConcept] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class AnalystOutput(BaseModel):
    """Structured output contract returned by the Claude analyst tool."""

    report_markdown: str
    campaign_playbook: str
    decision_makers: list[dict] = Field(default_factory=list)
    outreach_drafts: list[dict] = Field(default_factory=list)
