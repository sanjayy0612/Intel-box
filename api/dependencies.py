"""Dependency providers for FastAPI routes and shared in-memory run state."""

from __future__ import annotations

from collections.abc import MutableMapping

from mcp.client import MongoMCPClient
from mcp.operations import IntelBoxRepository
from models import AgentRunRecord
from pipeline.runner import IntelBoxRunner

RUN_STORE: MutableMapping[str, AgentRunRecord] = {}


async def get_repository() -> IntelBoxRepository:
    """Create a repository backed by a short-lived MCP client."""

    client = MongoMCPClient()
    await client.__aenter__()
    return IntelBoxRepository(client)


async def get_runner() -> IntelBoxRunner:
    """Create the end-to-end runner."""

    return await IntelBoxRunner.create()


def get_run_store() -> MutableMapping[str, AgentRunRecord]:
    """Expose the in-memory run store for polling endpoints."""

    return RUN_STORE
