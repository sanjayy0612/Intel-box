/** Outreach tracker summary panel. */

import React from "react";

export default function TrackerDashboard() {
  return (
    <section style={{ background: "rgba(15, 23, 42, 0.72)", borderRadius: 24, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Tracker Dashboard</h2>
      <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
        Use the `/track` API route to update send, open, and reply states for follow-up generation.
      </p>
    </section>
  );
}
