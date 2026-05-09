"""Routes for listing previously generated reports."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.dependencies import get_repository
from mcp.operations import ClientIQRepository

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(repository: ClientIQRepository = Depends(get_repository)) -> dict[str, list[dict]]:
    """List cached reports from MongoDB."""

    reports = await repository.list_reports()
    return {"reports": reports}
