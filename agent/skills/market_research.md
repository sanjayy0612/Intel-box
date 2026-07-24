---
name: market-research
description: Researching a company's market position, brand perception, and competitive landscape using web_search, competitor_search, and scrape_url.
---

Use this skill to build the market-intelligence side of a company profile.

- `web_search` is the default starting point for brand perception, news, funding events, and
  general market context. Most runs need at least one web_search call.
- `competitor_search` finds direct competitors in the company's category. Call it when the task
  requires competitive positioning, not just a standalone brand snapshot.
- `scrape_url` is for depth, not breadth: only call it on a specific URL surfaced by web_search or
  competitor_search when the search snippet isn't enough (e.g. a competitor's pricing page, a
  funding announcement worth reading in full).
- Don't call competitor_search or scrape_url for a quick brand-perception check that web_search
  alone already answers.
