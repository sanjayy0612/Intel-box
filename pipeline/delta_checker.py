"""Utilities for comparing new tool output against previously stored records."""

from __future__ import annotations

from typing import Any


def diff_brand_activity(previous: list[dict[str, Any]], current: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return only new or changed activity items."""

    previous_keys = {
        (item.get("title"), item.get("activity_type"), item.get("summary"))
        for item in previous
    }
    return [
        item
        for item in current
        if (item.get("title"), item.get("activity_type"), item.get("summary")) not in previous_keys
    ]
