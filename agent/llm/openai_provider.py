"""OpenAI adapter for the BYO-LLM interface."""

from __future__ import annotations

import json
from typing import Any

from agent.llm.base import ChatResponse, ToolCall, ToolResult, ToolSpec

try:
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover - dependency may be absent in minimal environments
    AsyncOpenAI = None

DEFAULT_MODEL = "gpt-4o"


class OpenAIClient:
    """LLMClient implementation backed by the OpenAI Chat Completions API.

    `base_url` lets other OpenAI-compatible providers (e.g. Groq) reuse this adapter's wire
    format instead of duplicating translation logic -- see agent/llm/groq_provider.py.
    """

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL, base_url: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    async def complete_text(self, *, system: str, prompt: str, max_tokens: int = 4000) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        )
        return (response.choices[0].message.content or "").strip()

    def start_conversation(
        self, *, system: str, tools: list[ToolSpec], max_tokens: int = 1024
    ) -> "OpenAIConversation":
        return OpenAIConversation(self._client, self._model, system, tools, max_tokens)


class OpenAIConversation:
    """Owns the OpenAI-native message history for one tool-calling conversation."""

    def __init__(
        self,
        client: "AsyncOpenAI",
        model: str,
        system: str,
        tools: list[ToolSpec],
        max_tokens: int,
    ) -> None:
        self._client = client
        self._model = model
        self._max_tokens = max_tokens
        self._tools = [
            {
                "type": "function",
                "function": {"name": t.name, "description": t.description, "parameters": t.parameters},
            }
            for t in tools
        ]
        self._messages: list[dict[str, Any]] = [{"role": "system", "content": system}]

    async def send_user_message(self, text: str) -> ChatResponse:
        self._messages.append({"role": "user", "content": text})
        return await self._step()

    async def send_tool_results(self, results: list[ToolResult]) -> ChatResponse:
        for result in results:
            self._messages.append(
                {
                    "role": "tool",
                    "tool_call_id": result.tool_call_id,
                    "content": json.dumps(result.output)[:4000],
                }
            )
        return await self._step()

    async def _step(self) -> ChatResponse:
        response = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=self._max_tokens,
            messages=self._messages,
            tools=self._tools or None,
        )
        message = response.choices[0].message
        self._messages.append(message.model_dump(exclude_none=True))
        tool_calls = [
            ToolCall(id=call.id, name=call.function.name, input=json.loads(call.function.arguments or "{}"))
            for call in (message.tool_calls or [])
        ]
        return ChatResponse(
            text=message.content or "",
            tool_calls=tool_calls,
            stop_reason="tool_use" if tool_calls else "end_turn",
        )
