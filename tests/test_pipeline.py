"""Tests for the pipeline helper behavior."""

from __future__ import annotations

from pipeline.delta_checker import diff_brand_activity


def test_diff_brand_activity_only_returns_new_items() -> None:
    previous = [{"title": "Launch", "activity_type": "product", "summary": "A"}]
    current = [
        {"title": "Launch", "activity_type": "product", "summary": "A"},
        {"title": "Campaign", "activity_type": "marketing", "summary": "B"},
    ]
    result = diff_brand_activity(previous, current)
    assert result == [{"title": "Campaign", "activity_type": "marketing", "summary": "B"}]
