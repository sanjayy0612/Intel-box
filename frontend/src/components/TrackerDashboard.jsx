/** Outreach tracker summary panel. */

import React from "react";
import { card, color } from "../styles/theme";

export default function TrackerDashboard() {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>Tracker dashboard</h2>
      <p style={{ color: color.textMuted, fontSize: 14, margin: 0 }}>
        Use the `/track` API route to update send, open, and reply states for follow-up generation.
      </p>
    </section>
  );
}
