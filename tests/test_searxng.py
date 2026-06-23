"""Integration test for the SearXNG-backed search client."""

from __future__ import annotations

from agent.tools.web_search import search


def test_search() -> None:
    result = search("OpenAI")
    assert result is not None
    assert len(result) > 0
