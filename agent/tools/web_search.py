"""SearXNG-backed web search helpers for sync API use and async agent orchestration."""

from __future__ import annotations

import os
from typing import Any

import requests

SEARX_URL = os.getenv("SEARXNG_URL", "http://localhost:8080")


def search(query: str, num_results: int = 8) -> list[dict[str, str]]:
    """Return parsed, structured SearXNG results for a query.

    Requires SearXNG's JSON output format to be enabled server-side (see
    deployment/searxng/settings.yml) -- otherwise this raises on the non-JSON response.
    """

    response = requests.get(
        f"{SEARX_URL}/search",
        params={"q": query, "format": "json"},
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()

    results = []
    for item in data.get("results", [])[:num_results]:
        title = (item.get("title") or "").strip()
        content = (item.get("content") or "").strip()
        url = (item.get("url") or "").strip()
        if not (title or content):
            continue
        results.append({"title": title, "content": content, "url": url})
    return results


async def run(payload: dict[str, Any]) -> dict[str, Any]:
    """Preserve the orchestrator contract while sourcing results from SearXNG."""

    query = payload["query"]
    results = search(query)
    summary = (
        "\n\n".join(f"{r['title']}\n{r['content']}\n{r['url']}" for r in results)
        or "No relevant results found."
    )
    sources = [r["url"] for r in results if r["url"]]
    return {"summary": summary, "sources": sources}


if __name__ == "__main__":
    print(search("OpenAI"))
