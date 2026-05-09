"""LinkedIn-oriented people search using Exa neural search with web fallback."""

from __future__ import annotations

import os
from typing import Any

import httpx


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Find likely decision-makers and normalize the output contract."""

    company = payload["company"]
    roles = payload["roles"]
    print({"tool": "linkedin_search", "payload": payload})

    exa_key = os.getenv("EXA_API_KEY")
    query = f"site:linkedin.com/in {company} {' OR '.join(roles)}"
    if exa_key:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.exa.ai/search",
                    headers={"x-api-key": exa_key, "content-type": "application/json"},
                    json={"query": query, "numResults": 8, "type": "neural"},
                )
                response.raise_for_status()
                data = response.json()
                people = []
                for item in data.get("results", []):
                    people.append(
                        {
                            "name": item.get("author") or item.get("title", "Unknown"),
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "snippet": item.get("text", "")[:280],
                        }
                    )
                return {"people": people}
        except Exception as exc:  # noqa: BLE001
            print({"tool": "linkedin_search", "fallback": "web_search", "error": str(exc)})

    return {
        "people": [
            {
                "name": "Fallback search required",
                "title": f"Use web_search site filter for {company}",
                "url": "",
                "snippet": query,
            }
        ]
    }
