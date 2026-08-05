/** Status pill and freshness dot -- the two indicators in the system.
 *
 *  Both draw from the status table in section 2. Do not invent a new colour for
 *  a new state; if a state isn't in that table, it isn't in the system yet.
 */

import React from "react";

import { freshnessState, relativeAge } from "../../utils/time";
import styles from "./Status.module.css";

const PILL_LABELS = {
  queued: "Queued",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  skipped: "Skipped",
};

/** Never more than one pill per row or card region. */
export function StatusPill({ state, label, className = "" }) {
  const text = label || PILL_LABELS[state] || state;
  return (
    <span className={`${styles.pill} ${styles[state] || styles.queued} t-mono-label ${className}`}>
      {text}
    </span>
  );
}

/** 6px circle plus a relative age. The colour is a hint; the words carry it. */
export function FreshnessDot({ lastResearched, className = "" }) {
  const state = freshnessState(lastResearched);
  const age = relativeAge(lastResearched);
  const suffix = state === "stale" ? " · stale" : "";

  return (
    <span className={`${styles.freshness} t-body-sm ${className}`}>
      <span className={`${styles.dot} ${styles[state]}`} aria-hidden="true" />
      <span>
        researched {age}
        {suffix}
      </span>
    </span>
  );
}
