/** Placeholder panel for outreach draft previews. */

import React from "react";

export default function OutreachDrafts() {
  return (
    <section style={{ background: "rgba(15, 23, 42, 0.72)", borderRadius: 24, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Outreach Drafts</h2>
      <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
        Draft previews can be hydrated from the `outreach_drafts` collection as the API expands.
      </p>
    </section>
  );
}
