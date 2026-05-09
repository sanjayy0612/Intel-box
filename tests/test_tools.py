"""Tests for tool contracts and normalized fallback payloads."""

from __future__ import annotations

import asyncio

from agent.tools import claude_analyst, competitor_search, firecrawl_scrape, linkedin_search, web_search


def test_web_search_contract() -> None:
    result = asyncio.run(web_search.run({"query": "Nike company overview", "company": "Nike"}))
    assert "summary" in result
    assert "sources" in result


def test_linkedin_search_contract() -> None:
    result = asyncio.run(linkedin_search.run({"company": "Nike", "roles": ["CMO"]}))
    assert "people" in result


def test_firecrawl_contract() -> None:
    result = asyncio.run(firecrawl_scrape.run({"url": "https://nike.com", "company": "Nike"}))
    assert {"markdown", "title", "fetched_at"} <= set(result.keys())


def test_competitor_search_contract() -> None:
    result = asyncio.run(competitor_search.run({"company": "Nike", "category": "sportswear"}))
    assert "competitors" in result


def test_claude_fallback_contract(monkeypatch) -> None:
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    result = asyncio.run(
        claude_analyst.run(
            {
                "company": "Nike",
                "category": "sportswear",
                "web_data": "",
                "linkedin_data": "",
                "financial_data": "",
                "competitor_data": "",
            }
        )
    )
    assert "report_markdown" in result
