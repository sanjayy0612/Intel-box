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
        record = run_store[run_id]
        record.updated_at = datetime.utcnow()
        matched = False
        for existing in record.steps:
            if existing.key == step.key:
                existing.status = step.status
                existing.detail = step.detail
                existing.updated_at = step.updated_at
                matched = True
        if not matched:
            record.steps.append(step)

    async def execute() -> None:
        try:
            result = await runner.run_company(request, status_callback=status_callback)
            result.run_id = run_id
            run_store[run_id] = result
        except Exception as exc:  # noqa: BLE001
            failed = run_store[run_id]
            failed.status = "failed"
            failed.updated_at = datetime.utcnow()
            for step in failed.steps:
                if step.status == "running":
                    step.status = "failed"
                    step.detail = str(exc)

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
