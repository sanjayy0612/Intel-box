/** Panel for the rendered campaign playbook markdown. */

import React from "react";
import ReactMarkdown from "react-markdown";

export default function CampaignPlaybook({ markdown }) {
  return (
    <section style={{ background: "rgba(15, 23, 42, 0.72)", borderRadius: 24, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Campaign Playbook</h2>
      {markdown ? <ReactMarkdown>{markdown}</ReactMarkdown> : <p style={{ color: "#cbd5e1" }}>Playbook will appear here.</p>}
    </section>
  );
}
