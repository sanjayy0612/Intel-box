/** Relative ages and cache freshness. The user's vocabulary is "last researched",
 *  never "cache TTL" -- that phrase only appears on the settings page. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cache entries expire at 30 days and start warning at 21. */
export const CACHE_TTL_DAYS = 30;
export const CACHE_AGING_DAYS = 21;

export function daysSince(value, now = Date.now()) {
  if (!value) return null;
  const then = typeof value === "number" ? value : Date.parse(value);
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / DAY_MS);
}

/** "fresh" | "aging" | "stale" -- the three states the freshness dot renders. */
export function freshnessState(value, now = Date.now()) {
  const days = daysSince(value, now);
  if (days === null) return "unknown";
  if (days >= CACHE_TTL_DAYS) return "stale";
  if (days >= CACHE_AGING_DAYS) return "aging";
  return "fresh";
}

/** "today", "4 days ago", "3 weeks ago". Sentence case, no abbreviations. */
export function relativeAge(value, now = Date.now()) {
  const days = daysSince(value, now);
  if (days === null) return "never";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 21) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 60) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
