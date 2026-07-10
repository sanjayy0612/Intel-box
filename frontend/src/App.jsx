/** Main React shell for collecting inputs and rendering IntelBox outputs. */

import React from "react";
import InputForm from "./components/InputForm";
import ReportViewer from "./components/ReportViewer";
import OutreachDrafts from "./components/OutreachDrafts";
import CampaignPlaybook from "./components/CampaignPlaybook";
import TrackerDashboard from "./components/TrackerDashboard";
import StatusStepper from "./components/StatusStepper";
import { useAgentRun } from "./hooks/useAgentRun";
import { color, pageShell } from "./styles/theme";

const capabilities = [
  { label: "Search", copy: "Broad web research on news, launches, and funding." },
  { label: "Competitors", copy: "Maps direct competitors in the same category." },
  { label: "People", copy: "Finds named decision-makers worth reaching out to." },
  { label: "Analysis", copy: "Synthesizes everything into one intelligence brief." },
];

export default function App() {
  const { runState, loading, error, startRun } = useAgentRun();

  return (
    <div style={pageShell}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "56px 24px 80px" }}>
        <header style={{ marginBottom: 48 }}>
          <p
            style={{
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: color.accent,
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            IntelBox
          </p>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: "0 0 20px",
              maxWidth: 780,
              fontWeight: 600,
            }}
          >
            Market intelligence, made even more useful.
          </h1>
          <p style={{ maxWidth: 620, color: color.textSecondary, lineHeight: 1.65, fontSize: 17, margin: 0 }}>
            Give the agent a company and a category. It decides which research tools it actually
            needs, runs them, and hands you back a brief and an outreach playbook.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 1,
            background: color.border,
            border: `1px solid ${color.border}`,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 48,
          }}
        >
          {capabilities.map((item) => (
            <div key={item.label} style={{ background: color.bg, padding: "22px 24px" }}>
              <p style={{ fontWeight: 600, margin: "0 0 6px", fontSize: 15 }}>{item.label}</p>
              <p style={{ margin: 0, color: color.textMuted, fontSize: 13.5, lineHeight: 1.5 }}>{item.copy}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 24, marginBottom: 24 }}>
          <InputForm onSubmit={startRun} loading={loading} />
          <StatusStepper steps={runState?.steps || []} status={runState?.status} error={error} />
        </div>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            alignItems: "start",
          }}
        >
          <ReportViewer report={runState?.report_markdown} company={runState?.company} />
          <div style={{ display: "grid", gap: 20 }}>
            <CampaignPlaybook markdown={runState?.campaign_playbook_markdown} />
            <OutreachDrafts />
            <TrackerDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
