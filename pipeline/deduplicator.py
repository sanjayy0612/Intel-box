"""Helpers for deciding whether a company run can reuse cached intelligence."""

from __future__ import annotations

from datetime import datetime, timedelta

from models import CompanyProfile


def is_profile_fresh(profile: CompanyProfile | None, max_age_days: int = 30) -> bool:
    """Return whether the cached profile can be reused for a new request."""

    if profile is None:
        return False
    return profile.last_run >= datetime.utcnow() - timedelta(days=max_age_days)
