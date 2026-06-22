# Currently Implemented — MIE-Agent

```
MIE-AGENT/
│
├── agent/
│   │
│   ├── orchestrator.py
│   │
│   ├── analyst/
│   │   ├── claude_analyst.py
│   │   ├── market_analysis.py
│   │   └── skill_loader.py
│   │
│   ├── skills/
│   │   └── market/
│   │       ├── general.md
│   │       ├── sportswear.md
│   │       ├── hospitality.md
│   │       ├── fintech.md
│   │       ├── saas.md
│   │       └── quick_commerce.md
│   │
│   └── tools/
│       ├── web_search.py
│       ├── linkedin_search.py
│       ├── competitor_search.py
│       ├── scrape_url.py
│       └── __init__.py
│
├── clients/
│   ├── searx_client.py
│   ├── crawl4ai_client.py
│   ├── claude_client.py
│   ├── gemini_client.py
│   └── mongodb_client.py
│
├── models/
│   ├── company_profile.py
│   ├── competitor.py
│   ├── decision_maker.py
│   ├── outreach.py
│   ├── campaign.py
│   ├── market_intelligence.py
│   └── agent_run.py
│
├── pipeline/
│   ├── research_pipeline.py
│   ├── enrichment_pipeline.py
│   ├── synthesis_pipeline.py
│   └── cache_pipeline.py
│
├── mcp/
│   ├── client.py
│   ├── collections.py
│   └── operations.py
│
├── api/
│   ├── main.py
│   ├── dependencies.py
│   │
│   └── routes/
│       ├── run.py
│       ├── reports.py
│       ├── tracker.py
│       └── health.py
│
├── frontend/
│
├── tests/
│   ├── test_web_search.py
│   ├── test_linkedin_search.py
│   ├── test_competitor_search.py
│   ├── test_scraper.py
│   ├── test_market_analysis.py
│   └── test_health.py
│
├── deployment/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── cloudbuild.yaml
│
├── output/
│
├── .env
├── .env.example
├── requirements.txt
└── README.md
```
