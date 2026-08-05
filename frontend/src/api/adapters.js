/** Turns an `AgentRunRecord` from the API into the shape the UI renders.
 *
 *  One function owns every derivation, so components never parse a step key and
 *  never guess at a missing field. Anything the backend doesn't send is returned
 *  as null rather than approximated -- the extraction log is a record, and a
 *  plausible-looking invented duration is worse than no duration at all.
 */

/** The four tools the agent can choose from, in the order the log lists them. */
export const TOOL_NAMES = ["web_search", "linkedin_search", "competitor_search", "scrape_url"];

const TERMINAL_RUN_STATES = ["completed", "failed", "cached"];

/** Older payloads label tool steps "Calling web_search" and encode the tool in
 *  the step key as `tool-<n>-<tool_name>-<id>`. Recover the name from either. */
function toolNameFromStep(step) {
  if (step.tool_name) return step.tool_name;
  if (typeof step.key === "string" && step.key.startsWith("tool-")) {
    const parts = step.key.split("-");
    if (parts.length >= 3) return parts.slice(2, parts.length > 3 ? -1 : undefined).join("-");
  }
  const match = /^Calling\s+(\S+)$/.exec(step.label || "");
  return match ? match[1] : null;
}

function isToolStep(step) {
  if (step.kind) return step.kind === "tool";
  return Boolean(toolNameFromStep(step));
}

/** Maps a step status onto the seven states in the design system's status table. */
function callState(step) {
  switch (step.status) {
    case "running":
      return "running";
    case "completed":
      return "complete";
    case "failed":
      return "failed";
    case "skipped":
      return "skipped";
    default:
      return "queued";
  }
}

export function normalizeRun(record) {
  if (!record) return null;

  const steps = Array.isArray(record.steps) ? record.steps : [];
  const toolSteps = steps.filter(isToolStep);
  const phaseSteps = steps.filter((step) => !isToolStep(step));

  // Skips are decisions, not events: they belong at the end of the sequence,
  // after the calls that were actually made, whatever order they arrived in.
  const executed = toolSteps.filter((step) => step.status !== "skipped");
  const skipped = toolSteps.filter((step) => step.status === "skipped");

  const calls = [...executed, ...skipped].map((step, index) => ({
    id: step.key,
    // Numbering is load-bearing: the calls genuinely are a sequence.
    index: index + 1,
    toolName: toolNameFromStep(step) || step.label,
    state: callState(step),
    outcome: step.detail || null,
    durationMs: typeof step.duration_ms === "number" ? step.duration_ms : null,
    updatedAt: step.updated_at || null,
  }));

  const timed = calls.filter((call) => call.durationMs !== null);

  return {
    runId: record.run_id,
    company: record.company,
    category: record.category,
    status: record.status,
    isTerminal: TERMINAL_RUN_STATES.includes(record.status),
    isRunning: record.status === "running" || record.status === "queued",
    fallbackMode: Boolean(record.fallback_mode),
    calls,
    totals: {
      calls: calls.filter((call) => call.state !== "skipped").length,
      skipped: skipped.length,
      // Null when nothing reported a duration, so the UI can omit the figure
      // instead of confidently rendering 0.0s.
      durationMs: timed.length ? timed.reduce((sum, call) => sum + call.durationMs, 0) : null,
    },
    phases: phaseSteps.map((step) => ({
      id: step.key,
      label: step.label,
      status: step.status,
      detail: step.detail || null,
    })),
    reportMarkdown: record.report_markdown || null,
    playbookMarkdown: record.campaign_playbook_markdown || null,
    createdAt: record.created_at || null,
    updatedAt: record.updated_at || null,
  };
}

/** "1.8s", "840ms", "7.4s". Durations sit in a tabular column, so keep them short. */
export function formatDuration(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return null;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** "4 calls, 7.4s" -- the running total in the extraction log header. */
export function formatTotals(totals) {
  if (!totals) return "";
  const parts = [`${totals.calls} ${totals.calls === 1 ? "call" : "calls"}`];
  const duration = formatDuration(totals.durationMs);
  if (duration) parts.push(duration);
  if (totals.skipped) parts.push(`${totals.skipped} skipped`);
  return parts.join(" · ");
}
