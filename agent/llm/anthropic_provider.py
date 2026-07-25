"""Anthropic adapter for the BYO-LLM interface."""

from __future__ import annotations

import json
from typing import Any

from agent.llm.base import ChatResponse, ToolCall, ToolResult, ToolSpec

try:
    from anthropic import AsyncAnthropic
except ImportError:  # pragma: no cover - dependency may be absent in minimal environments
    AsyncAnthropic = None

DEFAULT_MODEL = "claude-sonnet-4-20250514"


class AnthropicClient:
    """LLMClient implementation backed by the Anthropic Messages API."""

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def complete_text(self, *, system: str, prompt: str, max_tokens: int = 4000) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return _text_of(response.content)

    def start_conversation(
        self, *, system: str, tools: list[ToolSpec], max_tokens: int = 1024
    ) -> "AnthropicConversation":
        return AnthropicConversation(self._client, self._model, system, tools, max_tokens)


class AnthropicConversation:
    """Owns the Anthropic-native message history for one tool-calling conversation."""

    def __init__(
        self,
        client: "AsyncAnthropic",
        model: str,
        system: str,
        tools: list[ToolSpec],
        max_tokens: int,
    ) -> None:
        self._client = client
        self._model = model
        self._system = system
        self._tools = [
            {"name": t.name, "description": t.description, "input_schema": t.parameters} for t in tools
        ]
        self._max_tokens = max_tokens
        self._messages: list[dict[str, Any]] = []

    async def send_user_message(self, text: str) -> ChatResponse:
        self._messages.append({"role": "user", "content": text})
        return await self._step()

    async def send_tool_results(self, results: list[ToolResult]) -> ChatResponse:
        self._messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": r.tool_call_id,
                        "content": json.dumps(r.output)[:4000],
                    }
                    for r in results
                ],
            }
        )
        return await self._step()

    async def _step(self) -> ChatResponse:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=self._system,
            tools=self._tools,
            messages=self._messages,
        )
        self._messages.append({"role": "assistant", "content": response.content})
        tool_calls = [
            ToolCall(id=block.id, name=block.name, input=block.input)
            for block in response.content
            if getattr(block, "type", "") == "tool_use"
        ]
        return ChatResponse(
            text=_text_of(response.content),
            tool_calls=tool_calls,
            stop_reason="tool_use" if tool_calls else "end_turn",
        )


def _text_of(content: Any) -> str:
    return "\n".join(block.text for block in content if getattr(block, "type", "") == "text").strip()
