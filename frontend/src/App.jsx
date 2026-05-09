/** Main React shell for collecting inputs and rendering ClientIQ outputs. */

import React from "react";
import InputForm from "./components/InputForm";
import ReportViewer from "./components/ReportViewer";
import OutreachDrafts from "./components/OutreachDrafts";
import CampaignPlaybook from "./components/CampaignPlaybook";
import TrackerDashboard from "./components/TrackerDashboard";
import StatusStepper from "./components/StatusStepper";
import { useAgentRun } from "./hooks/useAgentRun";

const shellStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(252,211,77,0.35), transparent 30%), linear-gradient(135deg, #0f172a, #134e4a 55%, #f8fafc 160%)",
  color: "#e2e8f0",
  fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  padding: "32px 20px 48px",
};

const gridStyle = {
  display: "grid",
  gap: 20,
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  alignItems: "start",
};

export default function App() {
  const { runState, loading, error, startRun } = useAgentRun();

  return (
    <div style={shellStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", color: "#fcd34d" }}>
            ClientIQ
          </p>
          <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 4.8rem)", margin: "8px 0" }}>
            Market intelligence and outreach, one run at a time.
          </h1>
          <p style={{ maxWidth: 760, color: "#cbd5e1", lineHeight: 1.6 }}>
            Submit any company and category, follow the live stepper, and download the final markdown brief when the run completes.
          </p>
        </header>

        <InputForm onSubmit={startRun} loading={loading} />
        <StatusStepper steps={runState?.steps || []} status={runState?.status} error={error} />

        <div style={gridStyle}>
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
