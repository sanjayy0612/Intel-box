"""Health endpoint for quick deployment checks."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    """Return a simple service health payload."""

    return {"status": "ok"}
