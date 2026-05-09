"""End-to-end coordinator for ClientIQ runs from cache check to persistence."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Awaitable, Callable

from agent.orchestrator import ClientIQOrchestrator
from mcp.client import MongoMCPClient
from mcp.operations import ClientIQRepository
from models import (
    AgentRunRecord,
    AgentStep,
    CompanyRunRequest,
)

StatusCallback = Callable[[AgentStep], Awaitable[None]]


class ClientIQRunner:
    """Coordinates cache lookup, agent execution, and MongoDB persistence."""

    def __init__(self, repository: ClientIQRepository, orchestrator: ClientIQOrchestrator) -> None:
        self.repository = repository
        self.orchestrator = orchestrator

    @classmethod
    async def create(cls) -> "ClientIQRunner":
        """Create a runner with a managed MCP client and orchestrator."""

        client = MongoMCPClient()
        await client.__aenter__()
        repository = ClientIQRepository(client)
        orchestrator = ClientIQOrchestrator(repository=repository)
        return cls(repository=repository, orchestrator=orchestrator)

    async def run_company(
        self,
        request: CompanyRunRequest,
        status_callback: StatusCallback | None = None,
    ) -> AgentRunRecord:
        """Execute the full workflow, using cached data when available."""

        run_record = AgentRunRecord(
            run_id=str(uuid.uuid4()),
            company=request.company,
            category=request.category,
            status="queued",
            steps=[],
        )
        cached_profile = await self.repository.get_fresh_company_profile(request.company)
        if cached_profile:
            run_record.status = "cached"
            run_record.report_markdown = cached_profile.overview_summary
            run_record.steps.append(
                AgentStep(
                    key="cache",
                    label="Cache hit",
                    status="completed",
                    detail="Fresh company profile found in MongoDB.",
                )
            )
            return run_record

        async def emit(step: AgentStep) -> None:
            run_record.updated_at = datetime.utcnow()
            run_record.steps.append(step)
            if status_callback is not None:
                await status_callback(step)

        run_record.status = "running"
        await emit(AgentStep(key="research", label="Researching company", status="running"))
        result = await self.orchestrator.run(request.company, request.category, status_callback=emit)
        run_record.status = "completed"
        run_record.report_markdown = result["report_markdown"]
        run_record.campaign_playbook_markdown = result["campaign_playbook"]
        await emit(AgentStep(key="persist", label="Persisting results", status="completed"))
        run_record.updated_at = datetime.utcnow()
        return run_record
