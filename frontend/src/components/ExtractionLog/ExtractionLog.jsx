/** The extraction log: the agent's tool-use loop as a timed, numbered record.
 *
 *  Live during a run, permanent afterward as part of the run's provenance.
 *  Skipped steps are always shown -- they are the visible proof that the agent
 *  reasoned about the task rather than fanning out over every tool it has.
 */

import React, { useEffect, useRef } from "react";

import { formatDuration, formatTotals } from "../../api/adapters";
import styles from "./ExtractionLog.module.css";

const STATE_LABELS = {
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  skipped: "Skipped",
  queued: "Queued",
};

function padIndex(index) {
  return String(index).padStart(2, "0");
}

/** Tracks which rows are new since the last render, so only arriving entries
 *  animate. Re-renders from a poll must not re-animate the whole list. */
function useArrivingRows(calls) {
  const seenRef = useRef(new Set());
  const arriving = new Set();

  for (const call of calls) {
    if (!seenRef.current.has(call.id)) arriving.add(call.id);
  }

  useEffect(() => {
    for (const call of calls) seenRef.current.add(call.id);
  });

  return arriving;
}

function LogRow({ call, isArriving }) {
  const duration = formatDuration(call.durationMs);
  const showStateLabel = call.state === "failed" || call.state === "skipped";

  return (
    <li
      className={[styles.row, styles[call.state]].filter(Boolean).join(" ")}
      data-entering={isArriving ? "true" : undefined}
    >
      <span className={`${styles.index} t-mono-data`} aria-hidden="true" data-numeric>
        {padIndex(call.index)}
      </span>

      <span className={`${styles.toolName} t-mono-data`}>
        <span className="u-visually-hidden">Step {call.index}: </span>
        {call.toolName}
      </span>

      <span className={`${styles.duration} t-mono-data`} data-numeric>
        {duration || (call.state === "skipped" ? "—" : "")}
      </span>

      {(call.outcome || showStateLabel) && (
        <span className={`${styles.outcome} t-body-sm`}>
          {showStateLabel && (
            <span className={styles.stateLabel}>{STATE_LABELS[call.state]} — </span>
          )}
          {call.outcome ||
            (call.state === "skipped" ? "No reason given." : "No detail reported.")}
        </span>
      )}
    </li>
  );
}

export default function ExtractionLog({ run, emptyMessage }) {
  const calls = run?.calls || [];
  const arriving = useArrivingRows(calls);

  const executed = calls.filter((call) => call.state !== "skipped");
  const settled = executed.filter((call) => call.state !== "running" && call.state !== "queued");
  const progress = executed.length ? settled.length / executed.length : 0;
  const isRunning = Boolean(run?.isRunning);

  return (
    <section className={styles.panel} aria-labelledby="extraction-log-title">
      <div className={styles.header}>
        <h2 id="extraction-log-title" className={`${styles.headerTitle} t-mono-label`}>
          Extraction log
        </h2>
        {calls.length > 0 && (
          <span className={`${styles.headerTotals} t-mono-data`} data-numeric>
            {formatTotals(run.totals)}
          </span>
        )}
      </div>

      {run?.fallbackMode && (
        <p className={`${styles.fallbackNotice} t-body-sm`}>
          No provider configured — running all tools.
        </p>
      )}

      {calls.length === 0 ? (
        <p className={`${styles.notice} t-body-sm`}>
          {emptyMessage || "The agent hasn't chosen its tools yet."}
        </p>
      ) : (
        <>
          {/* Order carries information: each call was chosen in reaction to the
              previous result. Hence an ordered list, not a styled div stack. */}
          <ol className={styles.list} aria-live="polite" aria-relevant="additions text">
            {calls.map((call) => (
              <LogRow key={call.id} call={call} isArriving={arriving.has(call.id)} />
            ))}
          </ol>

          {isRunning && (
            <div
              className={styles.bar}
              role="progressbar"
              aria-label="Research progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <span className={styles.barFill} style={{ transform: `scaleX(${progress})` }} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
