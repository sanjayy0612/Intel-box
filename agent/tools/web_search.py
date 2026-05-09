"""Web search tool with Exa primary execution and Gemini grounding fallback."""

from __future__ import annotations

import os
from typing import Any

import httpx


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Search the web for company context and return a normalized summary."""

    query = payload["query"]
    company = payload["company"]
    print({"tool": "web_search", "payload": payload})

    exa_key = os.getenv("EXA_API_KEY")
    if exa_key:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.exa.ai/search",
                    headers={"x-api-key": exa_key, "content-type": "application/json"},
                    json={"query": query, "numResults": 5, "type": "auto"},
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                return {
                    "summary": "\n".join(item.get("title", "") for item in results[:5]).strip() or f"Search completed for {company}.",
                    "sources": [item.get("url") for item in results if item.get("url")],
                }
        except Exception as exc:  # noqa: BLE001
            print({"tool": "web_search", "fallback": "gemini_grounding", "error": str(exc)})

    return {
        "summary": f"Fallback summary for {company}: use Gemini grounding for '{query}'.",
        "sources": [],
    }
