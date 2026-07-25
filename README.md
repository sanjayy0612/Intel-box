# IntelBox 🚧

> **Status: Under Active Development**
>
> IntelBox is currently in development and not yet production-ready. Features, APIs, workflows, and architecture may change as the project evolves.

## Overview

IntelBox is an AI-powered market intelligence and outreach engine: give it a company name and a
category, and it researches the company, finds decision-makers, and drafts outreach.

Rather than a manually-wired workflow where you configure which providers run for every request,
IntelBox runs an autonomous agent that decides which research it actually needs for a given
company: a quick brand-perception check might only trigger a web search, while a full
outreach-ready profile also pulls in competitor mapping and decision-maker discovery. It's
self-hosted (MIT-licensed, no hosted product) and works with whichever LLM you bring — Anthropic
Claude, OpenAI, or Groq today, via a provider-neutral interface designed so more can be added
without touching the orchestrator.

## Current Progress

### Implemented

* FastAPI backend + React/Vite frontend
* Agentic tool-calling research loop — the model decides which of `web_search`, `linkedin_search`,
  `competitor_search`, `scrape_url` to call, one at a time, reacting to each result
* BYO-LLM interface (`agent/llm/`) — pluggable Anthropic Claude, OpenAI, or Groq (free-tier
  available), selected via `LLM_PROVIDER` or auto-detected from whichever API key is set
* Procedural skills system (`agent/skills/`) — markdown files describing research procedures,
  loaded into the agent's system prompt (all skills load together for now; no selection logic yet)
* Self-hosted SearXNG web search returning structured, parsed results (no per-query API cost)
* Decision-maker discovery and outreach draft generation (Exa API, with a fallback path)
* URL scraping (Firecrawl API, with a Jina Reader fallback)
* MongoDB persistence via a separate MCP server (JSON-RPC), with a 30-day company-profile cache
* Live run-status stepper — the frontend polls run status while the backend streams step-by-step
  updates instead of one opaque "researching..." phase

### In Progress / known gaps

* The outreach tracker (`POST /track`) accepts manual status updates from the frontend; automated
  follow-up detection (`IntelBoxRepository.find_follow_ups_due`) exists but nothing calls it yet
* Report and campaign-playbook synthesis is a single LLM call producing a flat markdown report —
  no structured market analysis (Porter's Five Forces, TAM/SAM/SOM, etc.)
* Test coverage is thin; the SearXNG integration test requires a live local instance
* `google-genai` is listed as a dependency but isn't wired into any code path — vestigial from an
  earlier iteration

### Planned

* Multi-user support
* Authentication and authorization
* Additional research providers and LLM adapters
* CRM integrations

---

## Tech Stack

* **Orchestrator:** an agentic tool-use loop over a provider-neutral LLM interface (`agent/llm/`)
* **LLM:** Anthropic Claude, OpenAI, or Groq, bring-your-own API key
* **Database:** MongoDB via a self-run MCP server (JSON-RPC), not an in-process driver
* **Research tools:** self-hosted SearXNG (web search), Exa API (competitor + decision-maker
  search, both with fallbacks), Firecrawl (page scraping, with a Jina Reader fallback)
* **Backend:** Python + FastAPI
* **Frontend:** React + Vite

---

## Repository Structure

```text
agent/        Agentic orchestrator, BYO-LLM interface, procedural skills, and tool adapters
api/          FastAPI routes and service endpoints
mcp/          MongoDB MCP client integrations
models/       Shared Pydantic data models
pipeline/     Orchestration and persistence workflow
output/       Report and playbook generation
frontend/     React application
docs/         Architecture and documentation
deployment/   Deployment configurations
tests/        Test suites
```

---

## Getting Started

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env

uvicorn api.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Local dependencies for a full end-to-end run:

* SearXNG for web search — `docker compose -f deployment/docker-compose.yml up searxng` (the
  compose file mounts `deployment/searxng/settings.yml`, which enables the JSON output format
  `web_search.py` requires; a self-run SearXNG instance needs the same setting)
* A MongoDB MCP server for persistence (`MONGODB_MCP_SERVER_URL`)

Without an LLM provider configured (see below), the orchestrator falls back to calling all four
research tools once instead of letting the agent decide.

---

## Environment Variables

```env
# LLM (bring at least one -- LLM_PROVIDER forces a choice; otherwise Anthropic is preferred, then OpenAI, then Groq)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
LLM_PROVIDER=

# Research tools
EXA_API_KEY=
FIRECRAWL_API_KEY=

# Database
MONGODB_URI=
MONGODB_DATABASE=intelbox
```

Optional:

```env
SEARXNG_URL=http://localhost:8080
MONGODB_MCP_SERVER_URL=http://localhost:8001/mcp
```

`GOOGLE_API_KEY` / `GOOGLE_CLOUD_PROJECT` also appear in `.env.example` but aren't read by any
current code path.

---

## Demo Targets

Current development testing uses:

1. Nike — sportswear
2. Zepto — quick commerce
3. Taj Hotels — hospitality

Expected output:

* Market intelligence report
* Competitor analysis
* Decision-maker discovery and outreach drafts
* MongoDB-backed persistence

---

## Deployment

Self-hosted only — there's no hosted IntelBox product. Deployment assets are included but should
be considered experimental until the first stable release.

* Docker Compose configuration (includes SearXNG)
* Cloud Run deployment configuration
* Architecture documentation (`docs/architecture.md`)

---

## Disclaimer

This project is under active development. Functionality may be incomplete, unstable, or subject to change without notice. APIs and data schemas should not yet be considered stable.

## License

MIT
