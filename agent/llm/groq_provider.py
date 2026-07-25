"""Groq adapter for the BYO-LLM interface.

Groq exposes an OpenAI-compatible Chat Completions API, so this just points the OpenAI adapter
at Groq's base URL and a Groq-hosted model instead of duplicating its translation logic.
"""

from __future__ import annotations

from agent.llm.openai_provider import OpenAIClient

DEFAULT_MODEL = "llama-3.3-70b-versatile"
BASE_URL = "https://api.groq.com/openai/v1"


class GroqClient(OpenAIClient):
    """LLMClient implementation backed by Groq's OpenAI-compatible API."""

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        super().__init__(api_key=api_key, model=model, base_url=BASE_URL)
