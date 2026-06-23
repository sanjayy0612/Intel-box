"""SearXNG-backed web search helpers for sync API use and async agent orchestration."""

from __future__ import annotations

import os
from typing import Any

import requests

SEARX_URL = os.getenv("SEARXNG_URL", "http://localhost:8080")


def search(query: str) -> str:
    """Return raw SearXNG search output for a query."""

    response = requests.get(
        f"{SEARX_URL}/search",
        params={"q": query},
        timeout=15,
    )
    response.raise_for_status()
    return response.text


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Preserve the orchestrator contract while sourcing results from SearXNG."""

    query = payload["query"]
    result = search(query)
    return {"summary": result[:5000], "sources": [f"{SEARX_URL}/search?q={query}"]}


if __name__ == "__main__":
    print(search("OpenAI")[:1000])
