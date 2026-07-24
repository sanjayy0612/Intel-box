"""Agentic orchestrator: the model decides which research tools to call, and when.

Replaces the old asyncio.gather fan-out (which called all four tools on every
run regardless of need) with a Claude tool-use loop. A quick brand-perception
check might only need web_search; a full outreach-ready profile might need
web_search + competitor_search + linkedin_search; scrape_url is only called
when a specific page needs deeper reading. Every tool call is emitted as its
own AgentStep so the frontend can render a live trace instead of one opaque
"research" phase.
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from typing import Any, Awaitable, Callable

from agent.skills import load_skills
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

try:
    from anthropic import AsyncAnthropic
except ImportError:  # pragma: no cover - dependency may be absent in minimal environments
    AsyncAnthropic = None

StatusCallback = Callable[[AgentStep], Awaitable[None]]

MODEL = "claude-sonnet-4-20250514"
MAX_TOOL_ITERATIONS = 6

AGENT_CORE_PROMPT = """You are IntelBox's research agent. You have four tools available: \
web_search, linkedin_search, competitor_search, and scrape_url.

Decide which tools this specific company and category actually require, and call them one at a \
time -- never call a tool you don't need just because it exists. Call tools one at a time so you \
can react to what each result contains -- for example, noticing a competitor is acquiring a \
startup and deciding to scrape that startup's site next. Once you have enough signal, stop \
calling tools and reply with a short plain-text confirmation that research is complete.

The sections below are your skills -- procedures for the two jobs this agent does: market \
research and decision-maker outreach. Follow whichever ones apply to the task at hand."""

AGENT_SYSTEM_PROMPT = f"{AGENT_CORE_PROMPT}\n\n{load_skills()}"

INTELBOX_TOOLS = [
    {
        "name": "web_search",
        "description": (
            "Search the web for company news, brand perception, product launches, funding "
            "events, and general market information. Use for broad research."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search query string"}},
            "required": ["query"],
        },
    },
    {
        "name": "linkedin_search",
        "description": (
            "Find named decision-makers, executives, and employees at the company on LinkedIn. "
            "Only call this if the task requires identifying people for outreach."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "roles": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Target roles, e.g. ['CMO', 'VP Marketing', 'Head of Growth']",
                }
            },
            "required": [],
        },
    },
    {
        "name": "competitor_search",
        "description": (
            "Find direct competitors of the company in its product/service category. "
            "Returns names, URLs, and brief descriptions."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "scrape_url",
        "description": (
            "Scrape full text content from a specific URL, such as the company's own site or a "
            "news article surfaced by web_search or competitor_search. Use this only when the "
            "snippet from a search result isn't enough detail."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
]


class IntelBoxOrchestrator:
    """Runs an agent-driven research loop, then synthesizes and persists results."""

    def __init__(self, repository: Any) -> None:
        self.repository = repository
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.client = AsyncAnthropic(api_key=api_key) if api_key and AsyncAnthropic else None

    async def run(
        self,
        company: str,
        category: str,
        status_callback: StatusCallback | None = None,
    ) -> dict[str, Any]:
        """Let the agent choose which tools to call, then synthesize and persist."""

        async def emit(step: AgentStep) -> None:
            if status_callback is not None:
                await status_callback(step)

        company_id = hashlib.sha1(f"{company}:{category}".encode("utf-8")).hexdigest()[:16]

        collected: dict[str, dict[str, Any]] = {}
        if self.client is not None:
            collected = await self._run_agent_loop(company, category, emit)
        else:
            collected = await self._run_deterministic_fallback(company, category, emit)

        web_data = collected.get("web_search") or {"summary": "No web research was run for this company.", "sources": []}
        linkedin_data = collected.get("linkedin_search") or {"people": []}
        competitor_data = collected.get("competitor_search") or {"competitors": []}
        scrape_data = collected.get("scrape_url") or {"markdown": "", "title": company}

        await emit(AgentStep(key="analysis", label="Synthesizing final brief", status="running"))
        analyst_result = await claude_analyst.run(
            {
                "company": company,
                "category": category,
                "web_data": web_data.get("summary", ""),
                "linkedin_data": str(linkedin_data.get("people", [])),
                "financial_data": (scrape_data.get("markdown") or "")[:3000],
                "competitor_data": str(competitor_data.get("competitors", [])),
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
            market_perception=web_data.get("summary", ""),
            overview_summary=analyst_result["report_markdown"],
            metadata={"scrape_title": scrape_data.get("title", company), "sources": web_data.get("sources", [])},
            last_run=datetime.utcnow(),
        )
        competitors = [
            CompetitorInsight(
                name=item.get("name", "Unknown"),
                revenue_hint=item.get("revenue_hint"),
                activity_summary=item.get("activity_summary", ""),
            )
            for item in competitor_data.get("competitors", [])
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
            for person in linkedin_data.get("people", [])
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

    # -- agent-driven path ------------------------------------------------

    async def _run_agent_loop(
        self,
        company: str,
        category: str,
        emit: Callable[[AgentStep], Awaitable[None]],
    ) -> dict[str, dict[str, Any]]:
        """Run the tool-calling loop, letting Claude pick tools one at a time."""

        collected: dict[str, dict[str, Any]] = {}
        messages: list[dict[str, Any]] = [
            {
                "role": "user",
                "content": (
                    f"Research {company} in the {category} category and gather what's needed "
                    "for a market intelligence brief. Only call the tools this specific task needs."
                ),
            }
        ]

        for _ in range(MAX_TOOL_ITERATIONS):
            response = await self.client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=AGENT_SYSTEM_PROMPT,
                tools=INTELBOX_TOOLS,
                messages=messages,
            )

            tool_calls = [block for block in response.content if getattr(block, "type", "") == "tool_use"]
            if not tool_calls:
                break

            messages.append({"role": "assistant", "content": response.content})
            tool_outputs = []

            for call in tool_calls:
                step_key = f"tool-{len(collected)}-{call.name}-{call.id[-6:]}"
                label = f"Calling {call.name}"
                await emit(
                    AgentStep(
                        key=step_key,
                        label=label,
                        status="running",
                        detail=self._describe_input(call.name, call.input),
                    )
                )
                try:
                    result = await self._dispatch_tool(call.name, call.input, company, category)
                except Exception as exc:  # noqa: BLE001
                    result = {"error": str(exc)}
                    await emit(
                        AgentStep(key=step_key, label=label, status="failed", detail=str(exc))
                    )
                else:
                    collected[call.name] = result
                    await emit(
                        AgentStep(
                            key=step_key,
                            label=label,
                            status="completed",
                            detail=self._summarize_result(call.name, result),
                        )
                    )

                tool_outputs.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": call.id,
                        "content": json.dumps(result)[:4000],
                    }
                )

            messages.append({"role": "user", "content": tool_outputs})

            if response.stop_reason == "end_turn":
                break

        return collected

    async def _dispatch_tool(
        self, name: str, tool_input: dict[str, Any], company: str, category: str
    ) -> dict[str, Any]:
        if name == "web_search":
            query = tool_input.get("query") or f"{company} company overview recent news"
            return await web_search.run({"query": query, "company": company})
        if name == "linkedin_search":
            roles = tool_input.get("roles") or ["CMO", "VP Marketing", "Head of Partnerships", "Growth Lead"]
            return await linkedin_search.run({"company": company, "roles": roles})
        if name == "competitor_search":
            return await competitor_search.run({"company": company, "category": category})
        if name == "scrape_url":
            url = tool_input.get("url") or f"https://www.{company.lower().replace(' ', '')}.com"
            return await firecrawl_scrape.run({"url": url, "company": company})
        raise ValueError(f"Unknown tool requested by agent: {name}")

    @staticmethod
    def _describe_input(name: str, tool_input: dict[str, Any]) -> str:
        if name == "web_search":
            return f"Query: {tool_input.get('query', '(default overview query)')}"
        if name == "linkedin_search":
            roles = tool_input.get("roles")
            return f"Roles: {', '.join(roles)}" if roles else "Default outreach-relevant roles"
        if name == "competitor_search":
            return "Searching for direct competitors"
        if name == "scrape_url":
            return f"URL: {tool_input.get('url', '(default company site)')}"
        return json.dumps(tool_input)

    @staticmethod
    def _summarize_result(name: str, result: dict[str, Any]) -> str:
        if name == "web_search":
            return f"{len(result.get('sources', []))} source(s) gathered."
        if name == "linkedin_search":
            return f"{len(result.get('people', []))} contact(s) found."
        if name == "competitor_search":
            return f"{len(result.get('competitors', []))} competitor(s) found."
        if name == "scrape_url":
            return f"Scraped: {result.get('title', '')}"
        return "Done."

    # -- fallback path (no ANTHROPIC_API_KEY configured) -------------------

    async def _run_deterministic_fallback(
        self,
        company: str,
        category: str,
        emit: Callable[[AgentStep], Awaitable[None]],
    ) -> dict[str, dict[str, Any]]:
        """Without an agent available, fall back to calling every tool once."""

        await emit(
            AgentStep(
                key="fallback",
                label="No ANTHROPIC_API_KEY set -- running all research tools",
                status="running",
            )
        )
        collected = {
            "web_search": await web_search.run(
                {"query": f"{company} company overview recent news", "company": company}
            ),
            "linkedin_search": await linkedin_search.run(
                {"company": company, "roles": ["CMO", "VP Marketing", "Head of Partnerships", "Growth Lead"]}
            ),
            "competitor_search": await competitor_search.run({"company": company, "category": category}),
            "scrape_url": await firecrawl_scrape.run(
                {"url": f"https://www.{company.lower().replace(' ', '')}.com", "company": company}
            ),
        }
        await emit(
            AgentStep(
                key="fallback",
                label="No ANTHROPIC_API_KEY set -- running all research tools",
                status="completed",
            )
        )
        return collected
