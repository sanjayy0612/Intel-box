/** Report renderer with markdown download support. */

import React from "react";
import ReactMarkdown from "react-markdown";

const panelStyle = {
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  borderRadius: 24,
  padding: 24,
  minHeight: 480,
};

export default function ReportViewer({ report, company }) {
  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(company || "clientiq-report").toLowerCase().replace(/\s+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Intelligence Brief</h2>
        <button
          type="button"
          onClick={downloadReport}
          disabled={!report}
          style={{ borderRadius: 999, padding: "10px 14px", border: "1px solid #cbd5e1", background: "white" }}
        >
          Download .md
        </button>
      </div>
      {report ? <ReactMarkdown>{report}</ReactMarkdown> : <p>The generated report will appear here.</p>}
    </section>
  );
}
