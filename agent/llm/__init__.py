"""BYO-LLM: a provider-neutral interface the orchestrator talks to instead of one hardcoded SDK.

Provider selection: set `LLM_PROVIDER` to "anthropic", "openai", or "groq" to force one. If
unset, the first provider with an API key present wins (checked in that order, Anthropic first
for backward compatibility with existing deployments). Returns None if no provider is configured,
so callers can fall back to a deterministic, non-agentic path.
"""

from __future__ import annotations

import os

from agent.llm.base import ChatResponse, LLMClient, LLMConversation, ToolCall, ToolResult, ToolSpec

_PROVIDERS = ("anthropic", "openai", "groq")


def get_llm_client() -> LLMClient | None:
    provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    if provider and provider not in _PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER {provider!r}; expected one of {_PROVIDERS}")

    if provider == "anthropic" or (not provider and os.getenv("ANTHROPIC_API_KEY")):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            from agent.llm.anthropic_provider import AnthropicClient

            return AnthropicClient(api_key=api_key)

    if provider == "openai" or (not provider and os.getenv("OPENAI_API_KEY")):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            from agent.llm.openai_provider import OpenAIClient

            return OpenAIClient(api_key=api_key)

    if provider == "groq" or (not provider and os.getenv("GROQ_API_KEY")):
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            from agent.llm.groq_provider import GroqClient

            return GroqClient(api_key=api_key)

    return None


__all__ = [
    "ChatResponse",
    "LLMClient",
    "LLMConversation",
    "ToolCall",
    "ToolResult",
    "ToolSpec",
    "get_llm_client",
]
