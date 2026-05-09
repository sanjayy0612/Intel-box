# ClientIQ

ClientIQ is an AI-powered market intelligence and outreach engine built for the Google Cloud Rapid Agent Hackathon. A user submits a company name and one-line category, and the system orchestrates research, competitor mapping, decision-maker discovery, outreach drafting, and campaign planning through a Gemini-led workflow backed by MongoDB Atlas MCP.

## Stack

- Orchestrator: Google ADK with Gemini 2.5 Pro
- Partner integration: MongoDB Atlas MCP Server
- External tools: Exa Search API, Firecrawl API, Anthropic Claude API
- Backend: Python + FastAPI
- Frontend: React + Vite

## Repository Layout

```text
agent/        Google ADK orchestration and tool adapters
api/          FastAPI routes for run, report, tracker, and health endpoints
mcp/          MongoDB MCP client and repository operations
models/       Pydantic contracts that define the shared data model
pipeline/     Cache checking, orchestration handoff, and persistence flow
output/       Markdown report and campaign playbook assembly helpers
frontend/     React application with status stepper and report viewer
docs/         Architecture, demo script, and schema documentation
deployment/   Docker and Cloud Run deployment assets
tests/        API, tool, and pipeline coverage
```

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn api.main:app --reload
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

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

`MONGODB_MCP_SERVER_URL` is optional and defaults to `http://localhost:8001/mcp`.

## Demo Flow

Run these three companies in sequence without code changes:

1. `Nike` — `sportswear`
2. `Zepto` — `quick commerce`
3. `Taj Hotels` — `hospitality`

Each run should return the same 10-section report structure, live run status, outreach context, and MongoDB-backed persistence.

## Deployment

- Local container: [deployment/docker-compose.yml](/Users/sanjayelango/Desktop/dev_me/MIE-agent-/deployment/docker-compose.yml)
- Cloud Run build: [deployment/cloudbuild.yaml](/Users/sanjayelango/Desktop/dev_me/MIE-agent-/deployment/cloudbuild.yaml)
- Architecture doc: [docs/architecture.md](/Users/sanjayelango/Desktop/dev_me/MIE-agent-/docs/architecture.md)

Hosted demo URL for submission: `TODO`

## License

MIT
