"""Provider-neutral types for the BYO-LLM interface.

Every provider (Anthropic, OpenAI, ...) speaks a different wire format for tool-calling and
conversation history. The orchestrator only ever talks in these types; each provider adapter
translates to and from its own native format internally, including owning the native message
history for a conversation so callers never see provider-specific shapes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, Any]


@dataclass
class ToolCall:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class ToolResult:
    tool_call_id: str
    output: dict[str, Any]


@dataclass
class ChatResponse:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    stop_reason: str = "end_turn"  # "tool_use" | "end_turn"


class LLMConversation(Protocol):
    """A single multi-turn, tool-calling conversation with one provider."""

    async def send_user_message(self, text: str) -> ChatResponse: ...

    async def send_tool_results(self, results: list[ToolResult]) -> ChatResponse: ...


class LLMClient(Protocol):
    """A configured connection to one LLM provider."""

    async def complete_text(self, *, system: str, prompt: str, max_tokens: int = 4000) -> str:
        """One-shot completion with no tool use, for synthesis-style calls."""
        ...

    def start_conversation(
        self, *, system: str, tools: list[ToolSpec], max_tokens: int = 1024
    ) -> LLMConversation:
        """Start a fresh multi-turn, tool-calling conversation."""
        ...
