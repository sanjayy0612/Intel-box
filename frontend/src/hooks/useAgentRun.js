/** Polling hook for creating and tracking IntelBox agent runs.
 *
 *  Unchanged in shape from the original: POST /run, then poll GET /run/:id every
 *  two seconds until the run reaches a terminal state. What's new is that the
 *  record goes through normalizeRun() first, so screens consume a view model
 *  instead of parsing step keys themselves, and that a run can be resumed by id
 *  -- the run detail screen is a real URL people reload and share.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { getRun, startRun as postRun } from "../api/client";
import { normalizeRun } from "../api/adapters";

const POLL_INTERVAL_MS = 2000;

export function useAgentRun() {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollerRef = useRef(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollerRef.current) {
      window.clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const beginPolling = useCallback(
    (runId) => {
      stopPolling();
      pollerRef.current = window.setInterval(async () => {
        try {
          const next = normalizeRun(await getRun(runId));
          if (!mountedRef.current) return;
          setRun(next);
          if (next.isTerminal) {
            setLoading(false);
            stopPolling();
          }
        } catch (pollError) {
          if (!mountedRef.current) return;
          // A failed poll is not a failed run, but it can't be silent either.
          setError(pollError.message || "Lost contact with the run.");
          setLoading(false);
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const startRun = useCallback(
    async (payload) => {
      setLoading(true);
      setError("");
      stopPolling();

      try {
        const initial = normalizeRun(await postRun(payload));
        if (!mountedRef.current) return null;
        setRun(initial);
        beginPolling(initial.runId);
        return initial;
      } catch (caughtError) {
        if (!mountedRef.current) return null;
        setError(caughtError.message || "Couldn't start the run.");
        setLoading(false);
        return null;
      }
    },
    [beginPolling, stopPolling]
  );

  /** Load a run by id and keep polling if it hasn't finished. */
  const resumeRun = useCallback(
    async (runId) => {
      if (!runId) return null;
      setError("");
      try {
        const record = normalizeRun(await getRun(runId));
        if (!mountedRef.current) return null;
        setRun(record);
        if (!record.isTerminal) {
          setLoading(true);
          beginPolling(runId);
        }
        return record;
      } catch (caughtError) {
        if (!mountedRef.current) return null;
        setError(caughtError.message || "Couldn't load that run.");
        setLoading(false);
        return null;
      }
    },
    [beginPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setRun(null);
    setError("");
    setLoading(false);
  }, [stopPolling]);

  return { run, loading, error, startRun, resumeRun, reset };
}
