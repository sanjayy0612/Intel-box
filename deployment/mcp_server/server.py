"""Local MongoDB MCP server for IntelBox.

`mcp/client.py` speaks JSON-RPC 2.0 over HTTP and calls two tools --
`mongodb.find` and `mongodb.upsert_one` -- returning plain JSON rather than the
MCP content-block envelope. That is IntelBox's own contract, not the shape of
the official MongoDB MCP server, so this implements it directly against pymongo.

It exists so the stack can run end to end locally. It is not an auth boundary:
bind it to localhost and put a real MCP server in front of a shared database.

    pip install -r deployment/mcp_server/requirements.txt
    uvicorn deployment.mcp_server.server:app --port 8001
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI
from pymongo import MongoClient
from pymongo.errors import PyMongoError

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

app = FastAPI(title="IntelBox MongoDB MCP server", version="0.1.0")
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)


def _clean(document: dict[str, Any]) -> dict[str, Any]:
    """Drop Mongo's ObjectId, which isn't JSON-serialisable and isn't ours."""

    return {key: value for key, value in document.items() if key != "_id"}


def _find(arguments: dict[str, Any]) -> dict[str, Any]:
    collection = client[arguments["database"]][arguments["collection"]]
    cursor = collection.find(arguments.get("filter") or {}).limit(
        int(arguments.get("limit", 10))
    )
    return {"documents": [_clean(document) for document in cursor]}


def _upsert_one(arguments: dict[str, Any]) -> dict[str, Any]:
    collection = client[arguments["database"]][arguments["collection"]]
    result = collection.update_one(
        arguments["filter"], {"$set": arguments["document"]}, upsert=True
    )
    return {
        "matched": result.matched_count,
        "modified": result.modified_count,
        "upserted_id": str(result.upserted_id) if result.upserted_id else None,
    }


TOOLS = {"mongodb.find": _find, "mongodb.upsert_one": _upsert_one}


@app.post("/mcp")
async def call_tool(request: dict[str, Any]) -> dict[str, Any]:
    """Handle a JSON-RPC `tools/call`."""

    request_id = request.get("id")
    params = request.get("params") or {}
    name = params.get("name")

    handler = TOOLS.get(name)
    if handler is None:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": f"Unknown tool {name!r}"},
        }

    try:
        result = handler(params.get("arguments") or {})
    except (PyMongoError, KeyError) as exc:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32000, "message": f"{type(exc).__name__}: {exc}"},
        }

    return {"jsonrpc": "2.0", "id": request_id, "result": result}


@app.get("/health")
async def health() -> dict[str, str]:
    try:
        client.admin.command("ping")
    except PyMongoError as exc:
        return {"status": "error", "detail": str(exc)}
    return {"status": "ok"}
