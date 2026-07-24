"""Repository helpers that route all MongoDB operations through MCP tools."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from mcp.client import MongoMCPClient
from mcp.collections import (
    BRAND_ACTIVITY,
    COMPANY_PROFILES,
    COMPETITOR_MAP,
    CONTACT_INTELLIGENCE,
    DECISION_MAKERS,
    OUTREACH_DRAFTS,
    OUTREACH_TRACKER,
)
from models import (
    BrandActivityRecord,
    CompanyProfile,
    CompetitorMapRecord,
    ContactIntelligence,
    DecisionMaker,
    OutreachDraft,
    OutreachTrackerEntry,
)


class IntelBoxRepository:
    """High-level persistence API for the IntelBox pipeline."""

    def __init__(self, client: MongoMCPClient) -> None:
        self.client = client

    async def _find(self, collection: str, filter_query: dict[str, Any], limit: int = 10) -> list[dict[str, Any]]:
        result = await self.client.call_tool(
            "mongodb.find",
            {
                "database": self.client.database,
                "collection": collection,
                "filter": filter_query,
                "limit": limit,
            },
        )
        documents = result.get("documents") or result.get("result") or []
        return documents if isinstance(documents, list) else []

    async def _upsert(self, collection: str, filter_query: dict[str, Any], document: dict[str, Any]) -> dict[str, Any]:
        return await self.client.call_tool(
            "mongodb.upsert_one",
            {
                "database": self.client.database,
                "collection": collection,
                "filter": filter_query,
                "document": document,
            },
        )

    async def get_company_profile(self, company_name: str) -> CompanyProfile | None:
        docs = await self._find(COMPANY_PROFILES.name, {"company_name": company_name}, limit=1)
        return CompanyProfile.model_validate(docs[0]) if docs else None

    async def get_fresh_company_profile(self, company_name: str, max_age_days: int = 30) -> CompanyProfile | None:
        docs = await self._find(COMPANY_PROFILES.name, {"company_name": company_name}, limit=1)
        if not docs:
            return None
        profile = CompanyProfile.model_validate(docs[0])
        if profile.last_run >= datetime.utcnow() - timedelta(days=max_age_days):
            return profile
        return None

    async def save_company_profile(self, profile: CompanyProfile) -> dict[str, Any]:
        return await self._upsert(
            COMPANY_PROFILES.name,
            {"company_id": profile.company_id},
            profile.model_dump(mode="json"),
        )

    async def save_competitor_map(self, record: CompetitorMapRecord) -> dict[str, Any]:
        return await self._upsert(
            COMPETITOR_MAP.name,
            {"company_id": record.company_id},
            record.model_dump(mode="json"),
        )

    async def save_brand_activity(self, record: BrandActivityRecord) -> dict[str, Any]:
        return await self._upsert(
            BRAND_ACTIVITY.name,
            {"company_id": record.company_id},
            record.model_dump(mode="json"),
        )

    async def upsert_decision_makers(self, people: list[DecisionMaker]) -> None:
        for person in people:
            await self._upsert(
                DECISION_MAKERS.name,
                {"person_id": person.person_id},
                person.model_dump(mode="json"),
            )

    async def upsert_contact_intelligence(self, contacts: list[ContactIntelligence]) -> None:
        for contact in contacts:
            await self._upsert(
                CONTACT_INTELLIGENCE.name,
                {"person_id": contact.person_id},
                contact.model_dump(mode="json"),
            )

    async def save_outreach_drafts(self, drafts: list[OutreachDraft]) -> None:
        for draft in drafts:
            await self._upsert(
                OUTREACH_DRAFTS.name,
                {"draft_id": draft.draft_id},
                draft.model_dump(mode="json"),
            )

    async def update_tracker_entry(self, entry: OutreachTrackerEntry) -> dict[str, Any]:
        return await self._upsert(
            OUTREACH_TRACKER.name,
            {"tracker_id": entry.tracker_id},
            entry.model_dump(mode="json"),
        )

    async def list_reports(self, limit: int = 25) -> list[dict[str, Any]]:
        return await self._find(COMPANY_PROFILES.name, {}, limit=limit)

    async def find_follow_ups_due(self) -> list[dict[str, Any]]:
        threshold = datetime.utcnow() - timedelta(days=3)
        return await self._find(
            OUTREACH_TRACKER.name,
            {"status": {"$in": ["sent", "opened"]}, "sent_at": {"$lte": threshold.isoformat()}},
            limit=100,
        )
