# ClientIQ 🚧

> **Status: Under Active Development**
>
> ClientIQ is currently in development and not yet production-ready. Features, APIs, workflows, and architecture may change as the project evolves.

## Overview

ClientIQ is an AI-powered market intelligence and outreach engine designed to automate company research, competitor analysis, decision-maker discovery, outreach generation, and campaign planning.

The platform orchestrates multiple AI models and data sources through a Gemini-led workflow, with MongoDB Atlas used for persistence and knowledge storage.

## Current Progress

### Implemented

* Google ADK orchestration framework
* Gemini 2.5 Pro integration
* MongoDB Atlas MCP integration
* FastAPI backend
* React + Vite frontend
* Research pipeline foundation
* Report generation framework
* Campaign planning workflow
* Status tracking system

### In Progress

* End-to-end workflow refinement
* Report quality improvements
* Outreach personalization
* Error handling and resiliency
* Performance optimization
* Deployment automation
* Comprehensive test coverage

### Planned

* Multi-user support
* Authentication and authorization
* Advanced analytics dashboard
* CRM integrations
* Additional research providers
* Campaign execution capabilities

---

## Tech Stack

* **Orchestrator:** Google ADK + Gemini 2.5 Pro
* **Database:** MongoDB Atlas via MCP
* **Research Tools:** Exa Search, Firecrawl
* **LLM Support:** Anthropic Claude
* **Backend:** Python + FastAPI
* **Frontend:** React + Vite

---

## Repository Structure

```text
agent/        Google ADK orchestration and tool adapters
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

---

## Environment Variables

```env
GOOGLE_API_KEY=
GOOGLE_CLOUD_PROJECT=
ANTHROPIC_API_KEY=
EXA_API_KEY=
FIRECRAWL_API_KEY=
MONGODB_URI=
MONGODB_DATABASE=clientiq
```

Optional:

```env
MONGODB_MCP_SERVER_URL=http://localhost:8001/mcp
```

---

## Demo Targets

Current development testing uses:

1. Nike — sportswear
2. Zepto — quick commerce
3. Taj Hotels — hospitality

Expected output:

* Market intelligence report
* Competitor analysis
* Outreach recommendations
* Campaign planning artifacts
* MongoDB-backed persistence

---

## Deployment

Deployment assets are included but should be considered experimental until the first stable release.

* Docker Compose configuration
* Cloud Run deployment configuration
* Architecture documentation

---

## Disclaimer

This project is under active development. Functionality may be incomplete, unstable, or subject to change without notice. APIs and data schemas should not yet be considered stable.

## License

MIT

