"""Competitor discovery tool using Exa with a search-framed fallback."""

from __future__ import annotations

import os
from typing import Any

import httpx


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Find competitor candidates and summarize observed activity."""

    company = payload["company"]
    category = payload["category"]
    print({"tool": "competitor_search", "payload": payload})

    query = f"Top competitors to {company} in {category}"
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
                competitors = []
                for item in data.get("results", [])[:5]:
                    competitors.append(
                        {
                            "name": item.get("title", "Unknown competitor"),
                            "revenue_hint": "Not available",
                            "activity_summary": item.get("text", "")[:320] or "Activity summary unavailable.",
                        }
                    )
                return {"competitors": competitors}
        except Exception as exc:  # noqa: BLE001
            print({"tool": "competitor_search", "fallback": "web_search", "error": str(exc)})

    return {
        "competitors": [
            {
                "name": f"{company} peer 1",
                "revenue_hint": "Fallback required",
                "activity_summary": f"Use web_search competitor framing for {company} in {category}.",
            }
        ]
    }
