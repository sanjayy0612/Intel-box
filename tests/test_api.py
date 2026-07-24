"""Tests for the FastAPI routes exposed by IntelBox."""

from __future__ import annotations

import asyncio

from httpx import ASGITransport, AsyncClient

from api.main import app


async def _healthcheck_request() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_healthcheck() -> None:
    asyncio.run(_healthcheck_request())
