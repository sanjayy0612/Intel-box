/** Live research trace: shows exactly which tools the agent chose to call, in order. */

import React from "react";
import { card, color, statusColor } from "../styles/theme";

export default function StatusStepper({ steps, status, error }) {
  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Research trace</h2>
        <span style={{ fontSize: 13, color: color.textMuted }}>{status || "idle"}</span>
      </div>

      {steps.length === 0 ? (
        <p style={{ margin: 0, color: color.textMuted, fontSize: 14 }}>
          Nothing has run yet. The agent will pick its own tools once you start a run.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {steps.map((step) => {
            const tone = statusColor[step.status] || statusColor.pending;
            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "center",
                  borderRadius: 10,
                  padding: "12px 16px",
                  background: color.bgMuted,
                  borderLeft: `3px solid ${tone.fg}`,
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{step.label}</span>
                  {step.detail ? (
                    <span style={{ fontSize: 12.5, color: color.textMuted }}>{step.detail}</span>
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: tone.fg,
                    background: tone.bg,
                    borderRadius: 999,
                    padding: "4px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {error ? (
        <p style={{ color: color.danger, marginTop: 16, marginBottom: 0, fontSize: 14 }}>{error}</p>
      ) : null}
    </section>
  );
}
