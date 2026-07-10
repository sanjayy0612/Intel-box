/** Placeholder panel for outreach draft previews. */

import React from "react";
import { card, color } from "../styles/theme";

export default function OutreachDrafts() {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>Outreach drafts</h2>
      <p style={{ color: color.textMuted, fontSize: 14, margin: 0 }}>
        Draft previews can be hydrated from the `outreach_drafts` collection as the API expands.
      </p>
    </section>
  );
}
