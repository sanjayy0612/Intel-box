"""Structured page scraping via Firecrawl with Jina Reader fallback."""

from __future__ import annotations

from datetime import datetime
import os
from typing import Any
from urllib.parse import quote

import httpx


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Scrape a page into markdown and return normalized metadata."""

    url = payload["url"]
    company = payload["company"]
    print({"tool": "firecrawl_scrape", "payload": payload})

    api_key = os.getenv("FIRECRAWL_API_KEY")
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"url": url, "formats": ["markdown"]},
                )
                response.raise_for_status()
                data = response.json().get("data", {})
                return {
                    "markdown": data.get("markdown", ""),
                    "title": data.get("metadata", {}).get("title", company),
                    "fetched_at": datetime.utcnow().isoformat(),
                }
        except Exception as exc:  # noqa: BLE001
            print({"tool": "firecrawl_scrape", "fallback": "jina_reader", "error": str(exc)})

    normalized_url = url.replace("https://", "").replace("http://", "")
    fallback_url = f"https://r.jina.ai/http://{quote(normalized_url, safe='/:')}"
    return {
        "markdown": f"Fallback scrape required via {fallback_url}",
        "title": company,
        "fetched_at": datetime.utcnow().isoformat(),
    }
