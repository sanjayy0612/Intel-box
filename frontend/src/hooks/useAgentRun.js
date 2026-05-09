/** Polling hook for creating and tracking ClientIQ agent runs. */

import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useAgentRun() {
  const [runState, setRunState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollerRef = useRef(null);

  const stopPolling = () => {
    if (pollerRef.current) {
      window.clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const startRun = async (payload) => {
    setLoading(true);
    setError("");
    stopPolling();
    try {
      const response = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const initial = await response.json();
      setRunState(initial);

      pollerRef.current = window.setInterval(async () => {
        const pollResponse = await fetch(`${API_BASE}/run/${initial.run_id}`);
        const next = await pollResponse.json();
        setRunState(next);
        if (["completed", "failed", "cached"].includes(next.status)) {
          setLoading(false);
          stopPolling();
        }
      }, 2000);
    } catch (caughtError) {
      setError(caughtError.message || "Unable to start the run.");
      setLoading(false);
    }
  };

  return { runState, loading, error, startRun };
}
