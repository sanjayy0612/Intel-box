/** Live run-status stepper for the ClientIQ frontend. */

import React from "react";

const colors = {
  pending: "#94a3b8",
  running: "#fcd34d",
  completed: "#34d399",
  failed: "#f87171",
};

export default function StatusStepper({ steps, status, error }) {
  return (
    <section style={{ background: "rgba(15, 23, 42, 0.72)", borderRadius: 24, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Run Status</h2>
      <p style={{ color: "#cbd5e1" }}>Current status: {status || "idle"}</p>
      <div style={{ display: "grid", gap: 12 }}>
        {steps.map((step) => (
          <div
            key={step.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              borderRadius: 14,
              padding: 14,
              background: "rgba(255,255,255,0.05)",
              borderLeft: `4px solid ${colors[step.status] || colors.pending}`,
            }}
          >
            <span>{step.label}</span>
            <span style={{ color: colors[step.status] || colors.pending }}>{step.status}</span>
          </div>
        ))}
      </div>
      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
    </section>
  );
}
