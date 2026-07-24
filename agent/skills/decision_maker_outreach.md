---
name: decision-maker-outreach
description: Finding decision-makers at a company and gathering what's needed to draft personalized outreach, using linkedin_search.
---

Use this skill when the task requires identifying people to reach out to, not just a market
research brief.

- `linkedin_search` finds named decision-makers and employees at the target company. Pass the
  roles that actually matter for this outreach (e.g. `["CMO", "VP Marketing"]`) rather than a
  generic default list when the task specifies a role focus.
- Only call this tool when the task calls for outreach-ready output. A pure market-perception or
  competitor-mapping request does not need decision-maker discovery.
- Prefer running market-research first so decision-maker discovery and outreach drafts can be
  grounded in what the company actually does and who it competes with.
