/** A run that actually unfolds over time, for fixture mode.
 *
 *  A static "running" fixture can't show what the extraction log is for: rows
 *  arriving one at a time, the Crema row moving down the panel, the extraction
 *  bar filling. This replays a scripted run against the wall clock so polling
 *  behaves exactly as it does against the real API.
 */

const SCRIPT = [
  { at: 0.0, step: { key: "queued", label: "Queued", status: "completed", detail: "Request accepted.", kind: "phase" } },
  { at: 0.0, step: { key: "research", label: "Researching company", status: "running", kind: "phase" } },

  { at: 0.4, step: { key: "tool-0-web_search", label: "web_search", status: "running", kind: "tool", tool_name: "web_search", detail: "Query: funding, category share, recent launches" } },
  { at: 2.2, step: { key: "tool-0-web_search", label: "web_search", status: "completed", kind: "tool", tool_name: "web_search", duration_ms: 1800, detail: "Funding, category share, launches — 12 results" } },

  { at: 2.6, step: { key: "tool-1-competitor_search", label: "competitor_search", status: "running", kind: "tool", tool_name: "competitor_search", detail: "Searching for direct competitors" } },
  { at: 5.8, step: { key: "tool-1-competitor_search", label: "competitor_search", status: "completed", kind: "tool", tool_name: "competitor_search", duration_ms: 3200, detail: "6 competitors mapped in the same category" } },

  { at: 6.2, step: { key: "tool-2-linkedin_search", label: "linkedin_search", status: "running", kind: "tool", tool_name: "linkedin_search", detail: "Looking for growth and category leads" } },
  { at: 8.6, step: { key: "tool-2-linkedin_search", label: "linkedin_search", status: "completed", kind: "tool", tool_name: "linkedin_search", duration_ms: 2400, detail: "4 growth and category leads found" } },

  { at: 9.0, step: { key: "skip-3-scrape_url", label: "scrape_url", status: "skipped", kind: "tool", tool_name: "scrape_url", detail: "Search results already covered the about page" } },

  { at: 9.2, step: { key: "research", label: "Researching company", status: "completed", kind: "phase" } },
  { at: 9.4, step: { key: "analysis", label: "Synthesizing final brief", status: "running", kind: "phase" } },
  { at: 13.0, step: { key: "analysis", label: "Synthesizing final brief", status: "completed", kind: "phase" } },
  { at: 13.4, step: { key: "persist", label: "Persisting results", status: "completed", kind: "phase" } },
];

const COMPLETES_AT = 13.4;

const REPORT = [
  "# Company overview",
  "",
  "The company operates a dark-store network across eleven metros, positioning on",
  "ten-minute delivery rather than assortment breadth. Category share has grown in",
  "tier-1 cities while remaining thin outside them.",
  "",
  "## Market position",
  "",
  "The category has consolidated to three serious operators. The differentiation here",
  "is operational rather than commercial: store density per square kilometre, not price.",
  "",
  "## Strategic watchouts",
  "",
  "- Dark-store unit economics remain unproven outside the top six cities.",
  "- Competitor discounting is currently funded by parent-company balance sheets.",
].join("\n");

const runs = new Map();

function buildRecord(run, elapsedSeconds) {
  const steps = [];
  for (const entry of SCRIPT) {
    if (entry.at > elapsedSeconds) continue;
    const updated_at = new Date(run.startedAt + entry.at * 1000).toISOString();
    const existing = steps.findIndex((step) => step.key === entry.step.key);
    const merged = { ...entry.step, updated_at };
    if (existing === -1) steps.push(merged);
    else steps[existing] = { ...steps[existing], ...merged };
  }

  const done = elapsedSeconds >= COMPLETES_AT;
  return {
    run_id: run.runId,
    company: run.company,
    category: run.category,
    status: done ? "completed" : "running",
    fallback_mode: false,
    steps,
    report_markdown: done ? REPORT : null,
    campaign_playbook_markdown: done ? "## Campaign playbook\n\n- Concept 1\n- Concept 2" : null,
    created_at: new Date(run.startedAt).toISOString(),
    updated_at: new Date(run.startedAt + Math.min(elapsedSeconds, COMPLETES_AT) * 1000).toISOString(),
  };
}

export const simulateRun = {
  async start(payload) {
    const runId = `${(payload.company || "run").toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const run = {
      runId,
      company: payload.company,
      category: payload.category,
      startedAt: Date.now(),
    };
    runs.set(runId, run);
    return buildRecord(run, 0);
  },

  async poll(runId) {
    const run = runs.get(runId);
    if (!run) {
      throw new Error("That run no longer exists. Start a new one.");
    }
    return buildRecord(run, (Date.now() - run.startedAt) / 1000);
  },
};
