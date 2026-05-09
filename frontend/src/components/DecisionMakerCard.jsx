/** Simple card for rendering a decision-maker profile. */

import React from "react";

export default function DecisionMakerCard({ person }) {
  return (
    <article style={{ background: "rgba(15,23,42,0.6)", borderRadius: 18, padding: 16 }}>
      <h3 style={{ margin: "0 0 6px" }}>{person?.name || "Decision maker"}</h3>
      <p style={{ margin: 0, color: "#cbd5e1" }}>{person?.title || "Title unavailable"}</p>
    </article>
  );
}
