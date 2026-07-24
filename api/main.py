"""FastAPI application that serves IntelBox routes to the frontend."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.health import router as health_router
from api.routes.reports import router as reports_router
from api.routes.run import router as run_router
from api.routes.search import router as search_router
from api.routes.tracker import router as tracker_router

app = FastAPI(title="IntelBox API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(search_router, prefix="/api")
app.include_router(run_router)
app.include_router(reports_router)
app.include_router(tracker_router)
