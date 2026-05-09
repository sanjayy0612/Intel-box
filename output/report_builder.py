"""Report assembly helpers for enforcing the required 10-section markdown format."""

from __future__ import annotations


def build_report(
    *,
    overview: str,
    market_position: str,
    competitors: str,
    brand_activity: str,
    events: str,
    watchouts: str,
    decision_makers: str,
    contacts: str,
    outreach: str,
    playbook: str,
) -> str:
    """Build a markdown report that matches the hackathon rubric exactly."""

    return "\n\n".join(
        [
            f"# 1. Company Overview\n{overview}",
            f"# 2. Market Position\n{market_position}",
            f"# 3. Competitor Mapping\n{competitors}",
            f"# 4. Brand Activity\n{brand_activity}",
            f"# 5. Experiential & Events Footprint\n{events}",
            f"# 6. Strategic Watchouts\n{watchouts}",
            f"# 7. Decision-Maker Identification\n{decision_makers}",
            f"# 8. Contact Intelligence\n{contacts}",
            f"# 9. Personalized Outreach\n{outreach}",
            playbook,
        ]
    )
