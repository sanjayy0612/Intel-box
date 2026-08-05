"""Routes for starting and polling IntelBox agent runs."""

from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_run_store, get_runner
from models import AgentRunRecord, AgentStep, CompanyRunRequest
from pipeline.runner import IntelBoxRunner

router = APIRouter(prefix="/run", tags=["run"])


@router.post("", response_model=AgentRunRecord)
async def start_run(
    request: CompanyRunRequest,
    runner: IntelBoxRunner = Depends(get_runner),
    run_store: dict[str, AgentRunRecord] = Depends(get_run_store),
) -> AgentRunRecord:
    """Start a new agent run and return the initial job record."""

    run_id = f"{request.company.lower().replace(' ', '-')}-{int(datetime.utcnow().timestamp())}"
    run_store[run_id] = AgentRunRecord(
        run_id=run_id,
        company=request.company,
        category=request.category,
        status="queued",
        steps=[
            AgentStep(key="queued", label="Queued", status="completed", detail="Request accepted."),
            AgentStep(key="research", label="Research", status="pending"),
            AgentStep(key="analysis", label="Analysis", status="pending"),
            AgentStep(key="persist", label="Persistence", status="pending"),
        ],
    )

    async def status_callback(step: AgentStep) -> None:
        run_store[run_id].apply_step(step)

    async def execute() -> None:
        try:
            result = await runner.run_company(request, status_callback=status_callback)
        except Exception as exc:  # noqa: BLE001
            failed = run_store[run_id]
            failed.status = "failed"
            failed.updated_at = datetime.utcnow()
            for step in failed.steps:
                if step.status == "running":
                    step.status = "failed"
                    step.detail = str(exc)
            return

        # The store record is the source of truth -- it already holds every step
        # merged by key. Copy the run's outcome onto it rather than replacing it,
        # which would drop the scaffold steps and duplicate the merged ones.
        record = run_store[run_id]
        for step in result.steps:
            record.apply_step(step)
        record.status = result.status
        record.fallback_mode = result.fallback_mode
        record.report_markdown = result.report_markdown
        record.campaign_playbook_markdown = result.campaign_playbook_markdown
        record.updated_at = datetime.utcnow()

    asyncio.create_task(execute())
    return run_store[run_id]


@router.get("/{run_id}", response_model=AgentRunRecord)
async def get_run(
    run_id: str,
    run_store: dict[str, AgentRunRecord] = Depends(get_run_store),
) -> AgentRunRecord:
    """Fetch current status for a previously started run."""

    record = run_store.get(run_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return record
