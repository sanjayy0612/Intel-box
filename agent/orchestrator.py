"""Google ADK-oriented orchestrator for coordinating ClientIQ tool execution."""

from __future__ import annotations

import asyncio
import hashlib
from datetime import datetime
from typing import Any, Awaitable, Callable

from agent.tools import claude_analyst, competitor_search, firecrawl_scrape, linkedin_search, web_search
from models import (
    AgentStep,
    BrandActivityRecord,
    CompanyProfile,
    CompetitorInsight,
    CompetitorMapRecord,
    DecisionMaker,
    OutreachDraft,
)

StatusCallback = Callable[[AgentStep], Awaitable[None]]


class ClientIQOrchestrator:
    """Runs the multi-tool pipeline expected from a Gemini ADK orchestrator."""

    def __init__(self, repository: Any) -> None:
        self.repository = repository

    async def run(
        self,
        company: str,
        category: str,
        status_callback: StatusCallback | None = None,
    ) -> dict[str, Any]:
        """Execute tool fan-out, synthesis, and persistence."""

        async def emit(step: AgentStep) -> None:
            if status_callback is not None:
                await status_callback(step)

        company_id = hashlib.sha1(f"{company}:{category}".encode("utf-8")).hexdigest()[:16]
        await emit(AgentStep(key="search", label="Running research tools", status="running"))

        web_task = web_search.run({"query": f"{company} company overview recent news", "company": company})
        linkedin_task = linkedin_search.run(
            {"company": company, "roles": ["CMO", "VP Marketing", "Head of Partnerships", "Growth Lead"]}
        )
        competitor_task = competitor_search.run({"company": company, "category": category})
        scrape_task = firecrawl_scrape.run({"url": f"https://www.{company.lower().replace(' ', '')}.com", "company": company})

        web_data, linkedin_data, competitor_data, scrape_data = await asyncio.gather(
            web_task,
            linkedin_task,
            competitor_task,
            scrape_task,
        )
        await emit(AgentStep(key="search", label="Running research tools", status="completed"))
        await emit(AgentStep(key="analysis", label="Synthesizing final brief", status="running"))

        analyst_result = await claude_analyst.run(
            {
                "company": company,
                "category": category,
                "web_data": web_data["summary"],
                "linkedin_data": str(linkedin_data["people"]),
                "financial_data": scrape_data["markdown"][:3000],
                "competitor_data": str(competitor_data["competitors"]),
            }
        )
        await emit(AgentStep(key="analysis", label="Synthesizing final brief", status="completed"))

        profile = CompanyProfile(
            company_id=company_id,
            company_name=company,
            category=category,
            business_model="AI-generated from web research",
            scale="Inferred from available sources",
            positioning="Summarized by the orchestrator",
            market_perception=web_data["summary"],
            overview_summary=analyst_result["report_markdown"],
            metadata={"scrape_title": scrape_data["title"], "sources": web_data["sources"]},
            last_run=datetime.utcnow(),
        )
        competitors = [
            CompetitorInsight(
                name=item.get("name", "Unknown"),
                revenue_hint=item.get("revenue_hint"),
                activity_summary=item.get("activity_summary", ""),
            )
            for item in competitor_data["competitors"]
        ]
        competitor_record = CompetitorMapRecord(
            company_id=company_id,
            company_name=company,
            category=category,
            competitors=competitors,
            last_run=datetime.utcnow(),
        )
        brand_activity_record = BrandActivityRecord(
            company_id=company_id,
            company_name=company,
            activities=[],
            last_run=datetime.utcnow(),
        )

        await self.repository.save_company_profile(profile)
        await self.repository.save_competitor_map(competitor_record)
        await self.repository.save_brand_activity(brand_activity_record)

        decision_makers = [
            DecisionMaker(
                person_id=hashlib.sha1(f"{company}:{person.get('name', '')}".encode("utf-8")).hexdigest()[:16],
                company_id=company_id,
                company_name=company,
                name=person.get("name", "Unknown"),
                title=person.get("title", "Unknown"),
                seniority_level="senior",
                role_relevance_score=0.8,
                linkedin_url=person.get("url") or None,
                snippet=person.get("snippet"),
            )
            for person in linkedin_data["people"]
            if person.get("name")
        ]
        await self.repository.upsert_decision_makers(decision_makers)

        drafts = [
            OutreachDraft(
                draft_id=hashlib.sha1(f"{person.person_id}:1".encode("utf-8")).hexdigest()[:16],
                person_id=person.person_id,
                company_id=company_id,
                linkedin_message=f"Hi {person.name}, sharing an idea relevant to {company}.",
                email_subject=f"Idea for {company}",
                email_body=f"Hi {person.name},\n\nWe spotted a few growth opportunities for {company}.",
                brand_context_used=[category],
            )
            for person in decision_makers[:5]
        ]
        await self.repository.save_outreach_drafts(drafts)

        return analyst_result
