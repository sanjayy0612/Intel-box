"""Loads the agent's procedural skills from agent/skills/*.md.

Each skill file is a short markdown doc with YAML-ish frontmatter (name, description) followed
by a body of instructions. For now every skill is always loaded and concatenated into the
orchestrator's system prompt -- there is no selection logic yet. `description` exists so a future
selection step (the agent picking which skills apply to a given task) can be added without
reshaping the file format.
"""

from __future__ import annotations

from pathlib import Path

SKILLS_DIR = Path(__file__).parent


def _strip_frontmatter(text: str) -> str:
    """Drop the leading `---\\n...\\n---` frontmatter block, if present."""

    if not text.startswith("---"):
        return text.strip()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return text.strip()
    return parts[2].strip()


def load_skills() -> str:
    """Read every skill file and concatenate their bodies into one prompt section."""

    sections = []
    for path in sorted(SKILLS_DIR.glob("*.md")):
        sections.append(_strip_frontmatter(path.read_text()))
    return "\n\n".join(sections)
