/** Helper hook for posting outreach tracker updates. */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useTracker() {
  const updateTracker = async (payload) => {
    const response = await fetch(`${API_BASE}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  return { updateTracker };
}
