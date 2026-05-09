"""Async JSON-RPC client for the MongoDB Atlas MCP server."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import httpx


class MCPClientError(RuntimeError):
    """Raised when the MCP server cannot fulfill a request."""


class MongoMCPClient:
    """Small JSON-RPC wrapper around a MongoDB MCP server endpoint."""

    def __init__(
        self,
        base_url: str | None = None,
        database: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url or os.getenv("MONGODB_MCP_SERVER_URL", "http://localhost:8001/mcp")
        self.database = database or os.getenv("MONGODB_DATABASE", "clientiq")
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None
        self._request_id = 0
        self._lock = asyncio.Lock()

    async def __aenter__(self) -> "MongoMCPClient":
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self

    async def __aexit__(self, *_exc_info: Any) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Call a named MCP tool and normalize the JSON-RPC response."""

        async with self._lock:
            self._request_id += 1
            request_id = self._request_id

        payload = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments},
        }
        print(json.dumps({"component": "mcp", "tool": tool_name, "payload": arguments}))

        client = self._client or httpx.AsyncClient(timeout=self.timeout)
        should_close = self._client is None
        try:
            response = await client.post(self.base_url, json=payload)
            response.raise_for_status()
            data = response.json()
        except Exception as exc:  # noqa: BLE001
            raise MCPClientError(f"MCP request failed for {tool_name}: {exc}") from exc
        finally:
            if should_close:
                await client.aclose()

        if "error" in data:
            raise MCPClientError(f"MCP error for {tool_name}: {data['error']}")

        result = data.get("result", {})
        if isinstance(result, dict):
            return result
        return {"result": result}
