"""Search route backed by the local SearXNG service."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from agent.tools.web_search import search

router = APIRouter()


@router.get("/search")
def run_search(q: str) -> dict[str, Any]:
    return {"query": q, "results": search(q)}
