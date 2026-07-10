/** Input form for starting a new IntelBox run. */

import React, { useState } from "react";
import { card, color } from "../styles/theme";

export default function InputForm({ onSubmit, loading }) {
  const [company, setCompany] = useState("Nike");
  const [category, setCategory] = useState("sportswear");

  return (
    <form
      style={{
        ...card,
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 16,
        alignItems: "end",
      }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ company, category });
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="company" style={{ fontSize: 13, fontWeight: 600, color: color.textSecondary }}>
          Company
        </label>
        <input
          id="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${color.border}`,
            fontSize: 15,
            color: color.text,
            background: color.bg,
          }}
        />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="category" style={{ fontSize: 13, fontWeight: 600, color: color.textSecondary }}>
          Category
        </label>
        <input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${color.border}`,
            fontSize: 15,
            color: color.text,
            background: color.bg,
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "13px 22px",
          borderRadius: 10,
          border: "none",
          background: loading ? color.textMuted : color.accent,
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          cursor: loading ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "Running..." : "Run IntelBox"}
      </button>
    </form>
  );
}
