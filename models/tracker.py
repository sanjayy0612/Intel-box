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
    """A discrete progress event exposed to the frontend.

    `kind` separates the two things the UI renders differently: coarse lifecycle
    phases (queued, analysis, persistence) and individual tool calls, which the
    extraction log shows as a numbered, timed sequence. A tool the agent chose
    *not* to call is still a step -- status "skipped" with the reason in
    `detail` -- because surfacing the decision is the point of the log.
    """

    key: str
    label: str
    status: Literal["pending", "running", "completed", "failed", "skipped"]
    detail: str | None = None
    kind: Literal["phase", "tool"] = "phase"
    tool_name: str | None = None
    duration_ms: int | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentRunRecord(BaseModel):
    """Lifecycle state for a report generation job."""

    run_id: str
    company: str
    category: str
    status: RunStatus
    steps: list[AgentStep] = Field(default_factory=list)
    # True when no LLM provider is configured and every tool ran unconditionally.
    # The UI must say so rather than let the fallback look like agentic behavior.
    fallback_mode: bool = False
    report_markdown: str | None = None
    campaign_playbook_markdown: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def apply_step(self, step: AgentStep) -> None:
        """Merge a step into the record, keyed on `key`.

        Steps are emitted twice -- once running, once resolved -- so anything that
        collects them has to merge rather than append, or the extraction log shows
        every tool call twice.
        """

        self.updated_at = datetime.utcnow()
        for existing in self.steps:
            if existing.key != step.key:
                continue
            existing.status = step.status
            existing.detail = step.detail
            existing.kind = step.kind
            existing.tool_name = step.tool_name
            # A running step carries no duration yet; don't wipe a measured one.
            if step.duration_ms is not None:
                existing.duration_ms = step.duration_ms
            existing.updated_at = step.updated_at
            return
        self.steps.append(step)
