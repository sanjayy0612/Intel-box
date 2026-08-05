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
import re
import time
from datetime import datetime
from typing import Any, Awaitable, Callable

from agent.llm import ToolResult, ToolSpec, get_llm_client
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

StatusCallback = Callable[[AgentStep], Awaitable[None]]

MAX_TOOL_ITERATIONS = 6

# What "research depth" on the new-research form actually changes. It steers the
# agent rather than hardcoding a tool count -- the whole point is that the model
# decides, and a depth setting that forced a fixed fan-out would undo that.
DEPTH_GUIDANCE = {
    "quick": (
        "This is a quick check: stop as soon as you have a defensible read on the "
        "company, usually after a single search."
    ),
    "standard": "Gather what this company actually requires -- no more, no less.",
    "deep": (
        "This is a deep profile: map the competitive set properly, and read source "
        "pages directly where a search snippet leaves real ambiguity."
    ),
}

AGENT_CORE_PROMPT = """You are IntelBox's research agent. You have four tools available: \
web_search, linkedin_search, competitor_search, and scrape_url.

Decide which tools this specific company and category actually require, and call them one at a \
time -- never call a tool you don't need just because it exists. Call tools one at a time so you \
can react to what each result contains -- for example, noticing a competitor is acquiring a \
startup and deciding to scrape that startup's site next. Once you have enough signal, stop \
calling tools and reply with a short plain-text confirmation that research is complete.

In that final message, account for every tool you did not call. Write one line per unused tool, \
in exactly this format and nothing else on the line:

SKIPPED: tool_name -- one short sentence explaining why it wasn't needed

The user sees these lines. They are the evidence that you reasoned about the task rather than \
running everything by default, so be specific about what made each tool unnecessary.

The sections below are your skills -- procedures for the two jobs this agent does: market \
research and decision-maker outreach. Follow whichever ones apply to the task at hand."""

AGENT_SYSTEM_PROMPT = f"{AGENT_CORE_PROMPT}\n\n{load_skills()}"

INTELBOX_TOOLS = [
    ToolSpec(
        name="web_search",
        description=(
            "Search the web for company news, brand perception, product launches, funding "
            "events, and general market information. Use for broad research."
        ),
        parameters={
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search query string"}},
            "required": ["query"],
        },
    ),
    ToolSpec(
        name="linkedin_search",
        description=(
            "Find named decision-makers, executives, and employees at the company on LinkedIn. "
            "Only call this if the task requires identifying people for outreach."
        ),
        parameters={
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
    ),
    ToolSpec(
        name="competitor_search",
        description=(
            "Find direct competitors of the company in its product/service category. "
            "Returns names, URLs, and brief descriptions."
        ),
        parameters={"type": "object", "properties": {}, "required": []},
    ),
    ToolSpec(
        name="scrape_url",
        description=(
            "Scrape full text content from a specific URL, such as the company's own site or a "
            "news article surfaced by web_search or competitor_search. Use this only when the "
            "snippet from a search result isn't enough detail."
        ),
        parameters={
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    ),
]


class IntelBoxOrchestrator:
    """Runs an agent-driven research loop, then synthesizes and persists results."""

    def __init__(self, repository: Any) -> None:
        self.repository = repository
        self.llm = get_llm_client()

    async def run(
        self,
        company: str,
        category: str,
        status_callback: StatusCallback | None = None,
        depth: str = "standard",
        find_people: bool = True,
    ) -> dict[str, Any]:
        """Let the agent choose which tools to call, then synthesize and persist."""

        async def emit(step: AgentStep) -> None:
            if status_callback is not None:
                await status_callback(step)

        company_id = hashlib.sha1(f"{company}:{category}".encode("utf-8")).hexdigest()[:16]

        fallback_mode = self.llm is None
        collected: dict[str, dict[str, Any]] = {}
        if fallback_mode:
            collected = await self._run_deterministic_fallback(
                company, category, emit, find_people=find_people
            )
        else:
            collected = await self._run_agent_loop(
                company, category, emit, depth=depth, find_people=find_people
            )

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

        analyst_result["fallback_mode"] = fallback_mode
        return analyst_result

    # -- agent-driven path ------------------------------------------------

    async def _run_agent_loop(
        self,
        company: str,
        category: str,
        emit: Callable[[AgentStep], Awaitable[None]],
        depth: str = "standard",
        find_people: bool = True,
    ) -> dict[str, dict[str, Any]]:
        """Run the tool-calling loop, letting the configured LLM pick tools one at a time."""

        collected: dict[str, dict[str, Any]] = {}
        called: list[str] = []
        tools = self._tools_for(find_people)
        conversation = self.llm.start_conversation(
            system=AGENT_SYSTEM_PROMPT, tools=tools, max_tokens=1024
        )

        response = await conversation.send_user_message(
            f"Research {company} in the {category} category and gather what's needed "
            f"for a market intelligence brief. {DEPTH_GUIDANCE[depth]} "
            "Only call the tools this specific task needs."
        )

        for _ in range(MAX_TOOL_ITERATIONS):
            if not response.tool_calls:
                break

            tool_results = []
            for call in response.tool_calls:
                # The index is part of the record the user reads, so it counts calls,
                # not distinct tools -- an agent that searches twice shows two rows.
                step_key = f"tool-{len(called)}-{call.name}-{call.id[-6:]}"
                called.append(call.name)
                await emit(
                    AgentStep(
                        key=step_key,
                        label=call.name,
                        status="running",
                        detail=self._describe_input(call.name, call.input),
                        kind="tool",
                        tool_name=call.name,
                    )
                )
                started = time.perf_counter()
                try:
                    result = await self._dispatch_tool(call.name, call.input, company, category)
                except Exception as exc:  # noqa: BLE001
                    result = {"error": str(exc)}
                    await emit(
                        AgentStep(
                            key=step_key,
                            label=call.name,
                            status="failed",
                            detail=str(exc),
                            kind="tool",
                            tool_name=call.name,
                            duration_ms=self._elapsed_ms(started),
                        )
                    )
                else:
                    collected[call.name] = result
                    await emit(
                        AgentStep(
                            key=step_key,
                            label=call.name,
                            status="completed",
                            detail=self._summarize_result(call.name, result),
                            kind="tool",
                            tool_name=call.name,
                            duration_ms=self._elapsed_ms(started),
                        )
                    )

                tool_results.append(ToolResult(tool_call_id=call.id, output=result))

            if response.stop_reason == "end_turn":
                break

            response = await conversation.send_tool_results(tool_results)

        await self._emit_skips(response.text, called, emit, tools)
        return collected

    @staticmethod
    def _tools_for(find_people: bool) -> list[ToolSpec]:
        """The tools the agent is allowed to see for this run."""

        if find_people:
            return INTELBOX_TOOLS
        return [spec for spec in INTELBOX_TOOLS if spec.name != "linkedin_search"]

    async def _emit_skips(
        self,
        final_text: str,
        called: list[str],
        emit: Callable[[AgentStep], Awaitable[None]],
        tools: list[ToolSpec],
    ) -> None:
        """Record the tools the agent declined, with its stated reason for each.

        Most products hide this. Surfacing it is the visible proof that the agent
        reasoned about the task instead of fanning out over every tool it has.
        """

        reasons = self._parse_skip_reasons(final_text)
        for index, spec in enumerate(tools):
            if spec.name in called:
                continue
            await emit(
                AgentStep(
                    key=f"skip-{index}-{spec.name}",
                    label=spec.name,
                    status="skipped",
                    detail=reasons.get(spec.name),
                    kind="tool",
                    tool_name=spec.name,
                )
            )

    @staticmethod
    def _parse_skip_reasons(final_text: str) -> dict[str, str]:
        """Pull `SKIPPED: tool_name -- reason` lines out of the agent's closing message."""

        pattern = re.compile(
            r"^\s*SKIPPED:\s*(?P<tool>[A-Za-z_][A-Za-z0-9_]*)\s*(?:--|—|–|-|:)\s*(?P<reason>.+?)\s*$",
            re.IGNORECASE | re.MULTILINE,
        )
        known = {spec.name for spec in INTELBOX_TOOLS}
        reasons: dict[str, str] = {}
        for match in pattern.finditer(final_text or ""):
            tool = match.group("tool").lower()
            if tool in known:
                reasons[tool] = match.group("reason")
        return reasons

    @staticmethod
    def _elapsed_ms(started: float) -> int:
        return int((time.perf_counter() - started) * 1000)

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
        find_people: bool = True,
    ) -> dict[str, dict[str, Any]]:
        """Without an agent available, fall back to calling every tool once.

        Each call still emits its own step so the log stays a real record, but the
        run is flagged `fallback_mode` so the UI can say plainly that nothing was
        chosen. A fallback must never masquerade as agentic behavior.
        """

        default_inputs: dict[str, dict[str, Any]] = {
            "web_search": {"query": f"{company} company overview recent news"},
            "linkedin_search": {
                "roles": ["CMO", "VP Marketing", "Head of Partnerships", "Growth Lead"]
            },
            "competitor_search": {},
            "scrape_url": {"url": f"https://www.{company.lower().replace(' ', '')}.com"},
        }

        if not find_people:
            default_inputs.pop("linkedin_search")

        collected: dict[str, dict[str, Any]] = {}
        for index, (name, tool_input) in enumerate(default_inputs.items()):
            step_key = f"tool-{index}-{name}"
            await emit(
                AgentStep(
                    key=step_key,
                    label=name,
                    status="running",
                    detail=self._describe_input(name, tool_input),
                    kind="tool",
                    tool_name=name,
                )
            )
            started = time.perf_counter()
            try:
                result = await self._dispatch_tool(name, tool_input, company, category)
            except Exception as exc:  # noqa: BLE001
                await emit(
                    AgentStep(
                        key=step_key,
                        label=name,
                        status="failed",
                        detail=str(exc),
                        kind="tool",
                        tool_name=name,
                        duration_ms=self._elapsed_ms(started),
                    )
                )
                continue
            collected[name] = result
            await emit(
                AgentStep(
                    key=step_key,
                    label=name,
                    status="completed",
                    detail=self._summarize_result(name, result),
                    kind="tool",
                    tool_name=name,
                    duration_ms=self._elapsed_ms(started),
                )
            )
        return collected
