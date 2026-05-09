"""Routes for updating outreach tracker records."""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from api.dependencies import get_repository
from mcp.operations import ClientIQRepository
from models import OutreachTrackerEntry, TrackerUpdateRequest

router = APIRouter(prefix="/track", tags=["tracker"])


@router.post("")
async def update_tracker(
    request: TrackerUpdateRequest,
    repository: ClientIQRepository = Depends(get_repository),
) -> dict:
    """Upsert an outreach tracker entry from the frontend dashboard."""

    entry = OutreachTrackerEntry(
        tracker_id=request.tracker_id,
        person_id="unknown",
        company_id="unknown",
        channel=request.channel,
        status=request.status,
        sent_at=datetime.utcnow() if request.status in {"sent", "opened", "replied"} else None,
        opened_at=datetime.utcnow() if request.status == "opened" else None,
        replied_at=datetime.utcnow() if request.status == "replied" else None,
        follow_up_due=datetime.utcnow() + timedelta(days=3),
    )
    await repository.update_tracker_entry(entry)
    return {"ok": True, "tracker_id": request.tracker_id}
