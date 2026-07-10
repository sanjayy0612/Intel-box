/** Panel for the rendered campaign playbook markdown. */

import React from "react";
import ReactMarkdown from "react-markdown";
import { card, color } from "../styles/theme";

export default function CampaignPlaybook({ markdown }) {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>Campaign playbook</h2>
      {markdown ? (
        <ReactMarkdown>{markdown}</ReactMarkdown>
      ) : (
        <p style={{ color: color.textMuted, fontSize: 14, margin: 0 }}>Playbook will appear here.</p>
      )}
    </section>
  );
}
