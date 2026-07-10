/** Report renderer with markdown download support. */

import React from "react";
import ReactMarkdown from "react-markdown";
import { card, color } from "../styles/theme";

export default function ReportViewer({ report, company }) {
  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(company || "intelbox-report").toLowerCase().replace(/\s+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{ ...card, minHeight: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Intelligence brief</h2>
        <button
          type="button"
          onClick={downloadReport}
          disabled={!report}
          style={{
            borderRadius: 999,
            padding: "8px 16px",
            border: `1px solid ${color.border}`,
            background: color.bg,
            fontSize: 13,
            fontWeight: 500,
            color: report ? color.text : color.textMuted,
            cursor: report ? "pointer" : "default",
          }}
        >
          Download .md
        </button>
      </div>
      {report ? (
        <ReactMarkdown>{report}</ReactMarkdown>
      ) : (
        <p style={{ color: color.textMuted, fontSize: 14 }}>The generated report will appear here.</p>
      )}
    </section>
  );
}
