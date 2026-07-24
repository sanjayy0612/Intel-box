# INTENTION.md — IntelBox v2

> This document is the authoritative plan for the IntelBox v2 rebuild. It replaces assumptions baked into the v1 codebase and should be treated as the source of truth before any new file is written.

---

## Why this rewrite

The v1 system was a proof-of-concept. It validated the core loop — take a company + category, gather signals, produce a report. It worked. But the architecture has three problems that compound as the product grows:

1. **Hard-wired parallelism.** `asyncio.gather` fires all four search tools regardless of what the query actually needs. A competitor scan doesn't need a LinkedIn people search. A decision-maker lookup doesn't need a firecrawl scrape. Every run is maximally expensive by design.

2. **Paid API lock-in.** Exa Search and Firecrawl are both external paid APIs. Both are single points of failure. Neither gives you control over which sources are queried, how results are ranked, or what data leaves your environment.

3. **No market analysis.** The output is research — not intelligence. There is no structural analysis of competitive forces, no market sizing, no domain-specific interpretation. The reports describe what is happening without saying what it means.

v2 fixes all three.

---

## Change 1 — Replace Exa Search with SearXNG

### Decision

All three Exa-based tools (`web_search.py`, `linkedin_search.py`, `competitor_search.py`) migrate to SearXNG, self-hosted via Docker. Firecrawl is replaced by Crawl4AI with Jina Reader as fallback.

### Why SearXNG

- **Zero API cost.** No keys, no rate limits beyond what upstream engines enforce. Infrastructure cost is a few dollars per month on a VPS or Railway.
- **Source control.** SearXNG aggregates 70+ engines (Google, Bing, DuckDuckGo, Brave, Wikipedia, Reddit). You configure exactly which engines are active in `settings.yml`.
- **JSON API.** Query `?q=<query>&format=json&categories=<category>` and receive a `results` array with `title`, `url`, `content`, `engine`, `score`. Drop-in replacement for the Exa response structure with a thin adapter.
- **Self-hosted = no data leakage.** For a B2B market intelligence product, this matters. Your prospect queries stay inside your stack.
- **MCP-native.** SearXNG has existing MCP server implementations (`ihor-sokoliuk/mcp-searxng`) if you want to expose it as an MCP tool to the agent layer later.

### Why Crawl4AI over Firecrawl

Crawl4AI is MIT-licensed, runs locally, outputs clean markdown, and handles JavaScript-heavy pages. It requires no external API call. Jina Reader (`r.jina.ai/`) remains the fallback — it's free for reasonable volume and requires no setup.

### Migration map

| v1 tool | v1 engine | v2 engine | SearXNG category |
|---|---|---|---|
| `web_search.py` | Exa API (auto, 5 results) | SearXNG | `general` |
| `linkedin_search.py` | Exa neural (site:linkedin.com/in, 8 results) | SearXNG + `site:linkedin.com/in` in query string | `general` |
| `competitor_search.py` | Exa API (auto, 5 results) | SearXNG | `news,general` |
| `firecrawl_scrape.py` | Firecrawl API | Crawl4AI → Jina Reader fallback | — |

### SearXNG adapter contract

Every tool keeps the existing `async def run(payload: dict) -> dict` contract. Internally, each now calls a shared `SearXNGClient` that wraps `httpx.AsyncClient`:

```python
# search/searxng_client.py
class SearXNGClient:
    def __init__(self, base_url: str):
        self.base_url = base_url  # from env: SEARXNG_URL

    async def search(self, query: str, category: str = "general", num_results: int = 8) -> list[dict]:
        params = {"q": query, "format": "json", "categories": category}
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(f"{self.base_url}/search", params=params)
            r.raise_for_status()
            return r.json().get("results", [])[:num_results]
```

### New environment variable

```env
# replaces EXA_API_KEY
SEARXNG_URL=http://localhost:8080
```

### Docker setup (add to docker-compose.yml)

```yaml
searxng:
  image: searxng/searxng:latest
  ports:
    - "8080:8080"
  volumes:
    - ./searxng:/etc/searxng
  networks:
    - intelbox-net
```

`searxng/settings.yml` must enable `formats: [html, json]` and set `limiter: false` for private deployment.

---

## Change 2 — Agentic tool-calling loop (replace asyncio.gather)

### Decision

Remove the hard-wired parallel fan-out in `orchestrator.py`. Replace with a Claude Sonnet agent loop that receives the query and a tool registry, decides which tools to call and in what order, executes them one at a time, and iterates until it has sufficient signal to synthesize.

### Why

The current fan-out is a script pretending to be an agent. It spends the same tokens and API calls on a simple "who are Nike's competitors?" query as it does on a deep "full intelligence brief on Zepto for a VP of Sales cold outreach" query. An agent loop spends exactly what the query warrants.

It also enables **multi-turn reasoning**: the agent can search for competitors, notice one is acquiring a startup, and immediately decide to scrape that startup's site — a behaviour the parallel fan-out can never express.

### Tool registry

Each tool becomes a Claude tool definition. Five tools in v2:

```python
INTELBOX_TOOLS = [
    {
        "name": "web_search",
        "description": (
            "Search the web for company news, brand perception, product launches, "
            "funding events, and general market information. Use for broad research."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query string"},
                "category": {
                    "type": "string",
                    "enum": ["general", "news", "it"],
                    "description": "SearXNG category filter"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "linkedin_search",
        "description": (
            "Find named decision-makers, executives, and employees at a company on LinkedIn. "
            "Use when you need CMO, VP Marketing, Head of Growth, or similar role contacts."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company": {"type": "string"},
                "role_filter": {
                    "type": "string",
                    "description": "Target role, e.g. 'CMO', 'VP Marketing', 'Head of Growth'"
                }
            },
            "required": ["company"]
        }
    },
    {
        "name": "competitor_search",
        "description": (
            "Find direct competitors of a company in a specific product or service category. "
            "Returns names, URLs, and brief descriptions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company": {"type": "string"},
                "category": {"type": "string", "description": "e.g. 'sportswear', 'quick commerce', 'luxury hotels'"}
            },
            "required": ["company", "category"]
        }
    },
    {
        "name": "scrape_url",
        "description": (
            "Scrape full text content from a URL. Use after web_search to extract detailed "
            "information from a specific company page, press release, or news article."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "extract_focus": {
                    "type": "string",
                    "description": "Optional: what to extract. e.g. 'financial data', 'leadership team', 'product lines'"
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "market_analysis",
        "description": (
            "Run structured market analysis for a company in a given domain. "
            "Produces Porter 5 Forces, TAM/SAM/SOM estimate, trend signals, and domain-specific insights. "
            "Call this after web_search and competitor_search have gathered sufficient raw data."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company": {"type": "string"},
                "domain": {
                    "type": "string",
                    "description": "Industry/domain key, e.g. 'sportswear', 'quick_commerce', 'hospitality'"
                },
                "raw_research": {
                    "type": "string",
                    "description": "Concatenated search results and scraped content gathered so far"
                }
            },
            "required": ["company", "domain", "raw_research"]
        }
    }
]
```

### Agent loop implementation

The loop replaces `IntelBoxOrchestrator.run()`:

```python
# pipeline/orchestrator.py (v2 sketch)

async def run(self, company: str, category: str) -> CompanyProfile:

    # 1. Intent classification (fast path — Haiku)
    intent = await self._classify_intent(company, category)
    # intent ∈ {prospect_research, competitive_intelligence, outreach_trigger}

    # 2. Load domain skill context
    domain_context = DomainSkillLoader.load(category)

    # 3. Agentic loop
    messages = [{"role": "user", "content": self._build_prompt(company, category, intent)}]
    tool_results = []

    while True:
        response = await self.claude_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=AGENT_SYSTEM_PROMPT + "\n\n" + domain_context,
            tools=INTELBOX_TOOLS,
            messages=messages
        )

        if response.stop_reason == "end_turn":
            break

        if response.stop_reason == "tool_use":
            tool_calls = [b for b in response.content if b.type == "tool_use"]
            tool_outputs = []

            for call in tool_calls:
                result = await self._dispatch_tool(call.name, call.input)
                tool_outputs.append({
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": json.dumps(result)
                })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_outputs})

    # 4. Synthesise final output from accumulated messages
    return await self._synthesise(messages, company, category)
```

### Intent classification

A lightweight pre-step using Claude Haiku (fast, cheap) to decide which tool subset the agent should prioritise:

```python
INTENT_TYPES = {
    "prospect_research":        # full profile — all tools eligible
    "competitive_intelligence": # competitor_search + market_analysis, skip linkedin
    "outreach_trigger":         # web_search (recent news) + linkedin_search only
}
```

This narrows the tool set passed into the agent loop, making it more predictable and reducing unnecessary calls.

---

## Change 3 — Market analysis module

### Decision

Add a `market_analysis` tool that the agent can invoke after gathering raw research. This tool runs structured analysis and returns a `MarketIntelligence` object that is stored in a new MongoDB collection.

### What it produces

```python
@dataclass
class MarketIntelligence:
    company: str
    domain: str
    timestamp: datetime

    porter_forces: PorterFiveForcesAnalysis
    # - competitive_rivalry: str + confidence
    # - supplier_power: str + confidence
    # - buyer_power: str + confidence
    # - threat_of_substitutes: str + confidence
    # - threat_of_new_entrants: str + confidence

    market_sizing: MarketSizing
    # - tam_estimate: str         e.g. "$12B globally"
    # - sam_estimate: str         e.g. "$800M India urban"
    # - som_estimate: str         e.g. "$40M reachable in 18mo"
    # - sizing_confidence: Literal["high", "medium", "low"]
    # - sizing_basis: str         how the estimate was derived

    trend_signals: list[TrendSignal]
    # each: {signal_type, description, source_url, confidence, date_observed}
    # signal_type ∈ {funding, acquisition, hiring_surge, product_launch,
    #                regulatory, leadership_change, partnership}

    competitive_moat: str           # one-paragraph assessment
    recommended_angle: str          # best outreach wedge given analysis
```

### Confidence scoring

Every substantive claim carries a `confidence` field: `high` (grounded in a named source), `medium` (inferred from multiple signals), or `low` (reasoned estimate from domain priors). This prevents the output from being treated as fact when it is inference.

### New MongoDB collection

```python
# mcp/collections.py — add to COLLECTIONS
MARKET_INTELLIGENCE = MongoCollection(
    name="market_intelligence",
    indexes=["company", "domain", "timestamp"],
    ttl_days=30
)
```

The MCP operations layer gets two new methods on `IntelBoxRepository`:

```python
async def save_market_intelligence(self, data: MarketIntelligence) -> None: ...
async def get_market_intelligence(self, company: str, domain: str, max_age_days: int = 30) -> MarketIntelligence | None: ...
```

---

## Change 4 — Domain skill files

### Decision

Create `skills/market/` with one `.md` file per domain. The `DomainSkillLoader` detects the domain from the incoming category string (fuzzy match + exact match) and injects the file into the agent system prompt before the loop starts.

### Why this pattern

This is the same insight behind Preciso's `SKILLS.md` system: the LLM does not need to be retrained to understand a domain — it needs the right framing injected at inference time. A skill file gives Claude the vocabulary, the metrics that matter, and the competitive dynamics it should look for in raw search results.

### File structure

```
skills/
  market/
    __init__.py
    _loader.py         DomainSkillLoader class
    general.md         fallback — Porter 5 generic, TAM/SAM/SOM template
    sportswear.md
    quick_commerce.md
    hospitality.md
```

### Skill file format

Each file follows a consistent schema so the loader can inject them uniformly:

```markdown
# Domain: Quick Commerce

## Category signal
quick_commerce, q-commerce, rapid delivery, dark store, 10-minute delivery, instant grocery

## Key metrics to extract
- Average order value (AOV)
- Orders per dark store per day
- Customer acquisition cost vs repeat order rate
- Dark store density per city
- Last-mile cost as % of AOV

## Competitive dynamics
[2-3 paragraphs on how competition plays out in this vertical]

## Buyer persona for outreach
[Who buys what this company sells, what they care about]

## Common outreach angles
[3-5 specific angles that tend to land in this domain]

## Red flags / risks to surface
[What negative signals to watch for in the research]
```

### Skill files to create for demo targets

| Demo company | Domain | Skill file |
|---|---|---|
| Nike | sportswear | `skills/market/sportswear.md` |
| Zepto | quick_commerce | `skills/market/quick_commerce.md` |
| Taj Hotels | hospitality | `skills/market/hospitality.md` |

---

## Change 5 — Additional ideas (planned, not yet scheduled)

### Temporal diffing

The 30-day cache check already exists. Extend it: when a fresh run overwrites a `company_profile` or `market_intelligence` record, first save the old record to a `_history` subcollection with its original timestamp. On the next synthesis, pass both old and new records to Claude and ask it to produce a `delta_summary` — what changed since the last analysis.

For a sales rep this is the highest-value output: not "here is Nike's competitive position" but "since your last touch, Nike announced a $200M investment in digital retail and their CMO changed."

```python
# New field on CompanyProfile
delta_summary: str | None   # None if no previous snapshot exists
delta_date: datetime | None
```

### Job posting signals

Job postings are one of the most reliable public signals of strategic intent. A company hiring 15 data engineers signals a platform rebuild. A first-ever VP of Partnerships hire signals a channel strategy shift. A wave of ML engineer postings signals a product AI layer.

Add `job_signal_search` as a sixth tool, lower-priority than the core five, invoked when the agent is running a `prospect_research` intent:

```python
{
    "name": "job_signal_search",
    "description": "Search for recent job postings at a company to infer strategic priorities and growth areas.",
    "input_schema": {
        "type": "object",
        "properties": {
            "company": {"type": "string"},
            "focus_area": {"type": "string", "description": "e.g. 'engineering', 'marketing', 'sales'"}
        },
        "required": ["company"]
    }
}
```

Implementation: SearXNG query `site:linkedin.com/jobs <company> <focus_area>` + Jina scrape of top 3 results.

### Outreach trigger detection

Currently outreach drafts are generated on every run regardless of whether there is a good reason to reach out. Add an `outreach_trigger_score` (0–1) computed by the analyst based on recency and significance of signals found. Only generate outreach drafts when the score exceeds a threshold (default: 0.6).

```python
outreach_trigger_score: float   # 0.0 = no signal, 1.0 = strong recent event
outreach_trigger_reason: str    # e.g. "Series C announced 3 days ago"
```

This prevents the outreach module from generating generic drafts when there is nothing timely to say.

---

## File change summary

### New files

```
search/
  searxng_client.py          SearXNGClient wrapper
  crawl4ai_scraper.py        Crawl4AI + Jina fallback

pipeline/
  intent_classifier.py       Haiku-based intent classification
  domain_skill_loader.py     DomainSkillLoader

skills/
  market/
    general.md
    sportswear.md
    quick_commerce.md
    hospitality.md

models/
  market_intelligence.py     MarketIntelligence + PorterFiveForces + MarketSizing dataclasses
```

### Modified files

```
pipeline/orchestrator.py     replace asyncio.gather fan-out with agent loop
pipeline/runner.py           add market_intelligence cache check
mcp/collections.py           add market_intelligence collection
mcp/operations.py            add save/get market_intelligence methods
tools/
  web_search.py              swap Exa → SearXNGClient
  linkedin_search.py         swap Exa → SearXNGClient (site: filter)
  competitor_search.py       swap Exa → SearXNGClient
  firecrawl_scrape.py        swap Firecrawl → Crawl4AI (rename to scrape_url.py)
docker-compose.yml           add searxng service
.env.example                 replace EXA_API_KEY with SEARXNG_URL
```

### Removed files

```
tools/firecrawl_scrape.py    → replaced by tools/scrape_url.py
```

---

## Environment variables (v2)

```env
# ── LLMs ──────────────────────────────────────
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# ── Search (replaces EXA_API_KEY) ─────────────
SEARXNG_URL=http://localhost:8080

# ── Scraping (replaces FIRECRAWL_API_KEY) ─────
# No key needed — Crawl4AI is local
# Jina fallback is free-tier, no key for basic use

# ── Database ──────────────────────────────────
MONGODB_URI=
MONGODB_DATABASE=intelbox
MONGODB_MCP_SERVER_URL=http://localhost:8001/mcp

# ── App ───────────────────────────────────────
GOOGLE_CLOUD_PROJECT=
```

---

## What does not change

- The `async def run(payload: dict) -> dict` contract on every tool — kept for testability.
- MongoDB MCP architecture — `MongoMCPClient` and `IntelBoxRepository` stay. Only new collection + methods added.
- The 30-day cache-first check in `runner.py` — extended, not replaced.
- The seven existing MongoDB collections — untouched. `market_intelligence` is additive.
- FastAPI backend and React + Vite frontend structure.
- The `claude_analyst.py` synthesis step — extended with market analysis output, not rewritten.

---

## Build order

1. Stand up SearXNG locally, verify JSON API responds.
2. Write `SearXNGClient` + adapter for each tool. Run existing `tests/test_tools.py` against new client.
3. Write `intent_classifier.py` + `domain_skill_loader.py`.
4. Rewrite `orchestrator.py` with the agent loop. Test on all three demo targets.
5. Write `MarketIntelligence` dataclasses + `market_analysis` tool implementation.
6. Write the three domain skill files (sportswear, quick_commerce, hospitality).
7. Add `market_intelligence` collection to MCP layer.
8. Integration test: end-to-end run on Nike, Zepto, Taj Hotels. Verify output shape and MongoDB persistence.
9. Write temporal diff logic (optional, post-demo).
10. Write job signal tool (optional, post-demo).