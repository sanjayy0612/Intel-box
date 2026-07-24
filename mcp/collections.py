"""MongoDB collection names and schema hints used by the MCP layer."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CollectionDefinition:
    """Simple metadata describing a MongoDB collection used by IntelBox."""

    name: str
    purpose: str
    key_fields: tuple[str, ...]


COMPANY_PROFILES = CollectionDefinition(
    name="company_profiles",
    purpose="Business model, scale, positioning, market perception, and cache freshness.",
    key_fields=("company_id", "company_name", "last_run"),
)
COMPETITOR_MAP = CollectionDefinition(
    name="competitor_map",
    purpose="3-5 competitors with strengths, gaps, and market activity.",
    key_fields=("company_id", "company_name", "last_run"),
)
BRAND_ACTIVITY = CollectionDefinition(
    name="brand_activity",
    purpose="Campaigns, launches, PR activity, and event footprint.",
    key_fields=("company_id", "company_name", "last_run"),
)
DECISION_MAKERS = CollectionDefinition(
    name="decision_makers",
    purpose="Named stakeholders and their role relevance scores.",
    key_fields=("person_id", "company_id", "company_name"),
)
CONTACT_INTELLIGENCE = CollectionDefinition(
    name="contact_intelligence",
    purpose="Contact channels, source metadata, and confidence.",
    key_fields=("person_id", "email", "linkedin_url"),
)
OUTREACH_DRAFTS = CollectionDefinition(
    name="outreach_drafts",
    purpose="Versioned LinkedIn and email outreach drafts.",
    key_fields=("draft_id", "person_id", "company_id", "version"),
)
OUTREACH_TRACKER = CollectionDefinition(
    name="outreach_tracker",
    purpose="Delivery, open, reply, and follow-up tracking.",
    key_fields=("tracker_id", "person_id", "company_id", "status"),
)

ALL_COLLECTIONS = (
    COMPANY_PROFILES,
    COMPETITOR_MAP,
    BRAND_ACTIVITY,
    DECISION_MAKERS,
    CONTACT_INTELLIGENCE,
    OUTREACH_DRAFTS,
    OUTREACH_TRACKER,
)
