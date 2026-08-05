/** Raw `AgentRunRecord` payloads, exactly as the API returns them.
 *
 *  These are the review surface for the extraction log. Every state in the design
 *  system's status table needs a fixture here, because "grayscale the screen --
 *  is every state still distinguishable" is unanswerable otherwise.
 *
 *  Keep these in API shape, not view shape: they must go through normalizeRun()
 *  like real data, or they stop testing the adapter.
 */

const BASE = Date.parse("2026-07-27T09:14:00Z");
const at = (secondsFromStart) => new Date(BASE + secondsFromStart * 1000).toISOString();

/** A run in flight: three calls done, the fourth still going. Exactly one Crema row. */
export const runningRun = {
  run_id: "zepto-1774600440",
  company: "Zepto",
  category: "quick commerce",
  status: "running",
  fallback_mode: false,
  created_at: at(0),
  updated_at: at(9),
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase", updated_at: at(0) },
    { key: "research", label: "Researching company", status: "running", kind: "phase", updated_at: at(1) },
    {
      key: "tool-0-web_search-a1b2c3",
      label: "web_search",
      status: "completed",
      detail: "Zepto funding, category share, launches — 12 results",
      kind: "tool",
      tool_name: "web_search",
      duration_ms: 1800,
      updated_at: at(3),
    },
    {
      key: "tool-1-competitor_search-d4e5f6",
      label: "competitor_search",
      status: "completed",
      detail: "6 competitors mapped in the same category",
      kind: "tool",
      tool_name: "competitor_search",
      duration_ms: 3200,
      updated_at: at(6),
    },
    {
      key: "tool-2-linkedin_search-g7h8i9",
      label: "linkedin_search",
      status: "running",
      detail: "Looking for growth and category leads",
      kind: "tool",
      tool_name: "linkedin_search",
      updated_at: at(9),
    },
  ],
};

/** A finished run with a skip. The skipped row is the most important thing here. */
export const completedRun = {
  run_id: "zepto-1774600100",
  company: "Zepto",
  category: "quick commerce",
  status: "completed",
  fallback_mode: false,
  created_at: at(0),
  updated_at: at(12),
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase", updated_at: at(0) },
    { key: "research", label: "Researching company", status: "completed", kind: "phase", updated_at: at(10) },
    { key: "analysis", label: "Synthesizing final brief", status: "completed", kind: "phase", updated_at: at(11) },
    { key: "persist", label: "Persisting results", status: "completed", kind: "phase", updated_at: at(12) },
    {
      key: "tool-0-web_search-a1b2c3",
      label: "web_search",
      status: "completed",
      detail: "Zepto funding, category share, launches — 12 results",
      kind: "tool",
      tool_name: "web_search",
      duration_ms: 1800,
      updated_at: at(3),
    },
    {
      key: "tool-1-competitor_search-d4e5f6",
      label: "competitor_search",
      status: "completed",
      detail: "6 competitors mapped in the same category",
      kind: "tool",
      tool_name: "competitor_search",
      duration_ms: 3200,
      updated_at: at(6),
    },
    {
      key: "tool-2-linkedin_search-g7h8i9",
      label: "linkedin_search",
      status: "completed",
      detail: "4 growth and category leads found",
      kind: "tool",
      tool_name: "linkedin_search",
      duration_ms: 2400,
      updated_at: at(9),
    },
    {
      key: "skip-3-scrape_url",
      label: "scrape_url",
      status: "skipped",
      detail: "Search results already covered the about page",
      kind: "tool",
      tool_name: "scrape_url",
      updated_at: at(10),
    },
  ],
  report_markdown: [
    "# Company overview",
    "",
    "Zepto operates a dark-store network across eleven Indian metros, positioning on",
    "ten-minute delivery rather than assortment breadth. Its category share has grown",
    "against Blinkit in tier-1 cities while remaining thin outside them.",
    "",
    "## Market position",
    "",
    "The category has consolidated to three serious operators. Zepto's differentiation",
    "is operational rather than commercial: store density per square kilometre, not price.",
    "",
    "## Strategic watchouts",
    "",
    "- Dark-store unit economics remain unproven outside the top six cities.",
    "- Competitor discounting is currently funded by parent-company balance sheets.",
  ].join("\n"),
  campaign_playbook_markdown: "## Campaign playbook\n\n- Concept 1\n- Concept 2\n- Concept 3",
};

/** A tool that broke. Ember, with the reason visible rather than swallowed. */
export const failedToolRun = {
  ...completedRun,
  run_id: "zepto-1774600200",
  status: "completed",
  steps: completedRun.steps.map((step) =>
    step.tool_name === "linkedin_search"
      ? {
          ...step,
          status: "failed",
          detail: "SearXNG didn't respond. Check the URL in settings.",
          duration_ms: 9000,
        }
      : step
  ),
};

/** No provider configured. Four tools, no decision behind any of them. */
export const fallbackRun = {
  run_id: "zepto-1774600300",
  company: "Zepto",
  category: "quick commerce",
  status: "completed",
  fallback_mode: true,
  created_at: at(0),
  updated_at: at(14),
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase", updated_at: at(0) },
    ...["web_search", "linkedin_search", "competitor_search", "scrape_url"].map((name, index) => ({
      key: `tool-${index}-${name}`,
      label: name,
      status: "completed",
      detail: "Ran unconditionally",
      kind: "tool",
      tool_name: name,
      duration_ms: 1500 + index * 700,
      updated_at: at(3 + index * 3),
    })),
  ],
  report_markdown: completedRun.report_markdown,
};

/** Served from cache: no log of its own, because no tools ran. */
export const cachedRun = {
  run_id: "zepto-1774600000",
  company: "Zepto",
  category: "quick commerce",
  status: "cached",
  fallback_mode: false,
  created_at: at(0),
  updated_at: at(0),
  steps: [
    {
      key: "cache",
      label: "Cache hit",
      status: "completed",
      detail: "Fresh company profile found in MongoDB.",
      kind: "phase",
      updated_at: at(0),
    },
  ],
  report_markdown: completedRun.report_markdown,
};

/** Started, nothing decided yet. Drives the pre-start empty state. */
export const queuedRun = {
  run_id: "notion-1774600500",
  company: "Notion",
  category: "productivity software",
  status: "queued",
  fallback_mode: false,
  created_at: at(0),
  updated_at: at(0),
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase", updated_at: at(0) },
    { key: "research", label: "Researching company", status: "pending", kind: "phase", updated_at: at(0) },
  ],
};

/** The whole run failed. */
export const failedRun = {
  run_id: "notion-1774600600",
  company: "Notion",
  category: "productivity software",
  status: "failed",
  fallback_mode: false,
  created_at: at(0),
  updated_at: at(4),
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase", updated_at: at(0) },
    {
      key: "tool-0-web_search-x1y2z3",
      label: "web_search",
      status: "failed",
      detail: "Can't reach SearXNG at localhost:8080. Check the URL in settings.",
      kind: "tool",
      tool_name: "web_search",
      duration_ms: 4000,
      updated_at: at(4),
    },
  ],
};

/** A payload from a backend that predates kind/tool_name/duration_ms, so the
 *  adapter's fallback parsing stays exercised rather than rotting. */
export const legacyRun = {
  run_id: "legacy-1774500000",
  company: "Swiggy Instamart",
  category: "quick commerce",
  status: "completed",
  steps: [
    { key: "queued", label: "Queued", status: "completed", detail: "Request accepted." },
    {
      key: "tool-0-web_search-abc123",
      label: "Calling web_search",
      status: "completed",
      detail: "8 source(s) gathered.",
      updated_at: at(4),
    },
    {
      key: "tool-1-competitor_search-def456",
      label: "Calling competitor_search",
      status: "completed",
      detail: "5 competitor(s) found.",
      updated_at: at(7),
    },
  ],
  report_markdown: "# Company overview\n\nLegacy payload with no per-call timing.",
};

export const runFixtures = {
  running: runningRun,
  completed: completedRun,
  failedTool: failedToolRun,
  fallback: fallbackRun,
  cached: cachedRun,
  queued: queuedRun,
  failed: failedRun,
  legacy: legacyRun,
};
