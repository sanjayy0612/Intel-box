"""Helpers for assembling the campaign playbook section when tool output is partial."""

from __future__ import annotations

from models import CampaignPlaybook


def build_campaign_markdown(playbook: CampaignPlaybook) -> str:
    """Render a structured campaign playbook into markdown."""

    lines = ["## 10. Campaign Playbook", ""]
    for index, concept in enumerate(playbook.concepts, start=1):
        lines.extend(
            [
                f"### Concept {index}: {concept.title}",
                f"- Audience: {concept.audience}",
                f"- Channels: {', '.join(concept.channels)}",
                f"- Value Proposition: {concept.value_proposition}",
                f"- KPIs: {', '.join(concept.kpis)}",
                "",
            ]
        )
    if playbook.notes:
        lines.append("### Notes")
        lines.extend([f"- {note}" for note in playbook.notes])
    return "\n".join(lines).strip()
