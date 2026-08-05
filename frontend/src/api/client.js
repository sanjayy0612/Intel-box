/** The one place the frontend talks to the API.
 *
 *  Set `VITE_USE_FIXTURES=1` to run the whole UI against the fixtures in
 *  src/fixtures/ instead. Without it, seeing any screen at all requires SearXNG,
 *  a Mongo MCP server, and an LLM key -- which makes design review impossible
 *  and makes the failure and skipped states practically unreachable.
 */

import { runFixtures } from "../fixtures/runs";
import { simulateRun } from "../fixtures/simulate";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES === "1";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch {
    // Errors say what broke and what to do -- never a raw exception.
    throw new ApiError(`Can't reach the IntelBox API at ${API_BASE}. Check that it's running.`, 0);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status === 404
        ? "That run no longer exists. Runs are held in memory and are lost when the API restarts."
        : `The API returned ${response.status}. Check the server logs.`,
      response.status
    );
  }
  return response.json();
}

export async function startRun(payload) {
  if (USE_FIXTURES) return simulateRun.start(payload);
  return request("/run", { method: "POST", body: JSON.stringify(payload) });
}

export async function getRun(runId) {
  if (USE_FIXTURES) {
    // A run started in this session replays live; a fixture's own id resolves to
    // that fixture, so /runs/:id is directly linkable during design review.
    const fixture = Object.values(runFixtures).find((record) => record.run_id === runId);
    if (fixture) return fixture;
    return simulateRun.poll(runId);
  }
  return request(`/run/${runId}`);
}

/** POST /track. The tracker table is the only caller. */
export async function updateTracker({ trackerId, status, channel }) {
  if (USE_FIXTURES) return { ok: true, tracker_id: trackerId };
  return request("/track", {
    method: "POST",
    body: JSON.stringify({ tracker_id: trackerId, status, channel }),
  });
}

/** Named fixture lookup, for design review. Returns null outside fixture mode. */
export function getFixtureRun(name) {
  return runFixtures[name] || null;
}

export { ApiError };
