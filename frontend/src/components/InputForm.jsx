/** Input form for starting a new ClientIQ run. */

import React, { useState } from "react";

const cardStyle = {
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(252, 211, 77, 0.25)",
  borderRadius: 24,
  padding: 24,
  backdropFilter: "blur(18px)",
};

export default function InputForm({ onSubmit, loading }) {
  const [company, setCompany] = useState("Nike");
  const [category, setCategory] = useState("sportswear");

  return (
    <form
      style={{ ...cardStyle, display: "grid", gap: 16 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ company, category });
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="company">Company</label>
        <input
          id="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          style={{ padding: 14, borderRadius: 12, border: "none" }}
        />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="category">Category</label>
        <input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={{ padding: 14, borderRadius: 12, border: "none" }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "14px 18px",
          borderRadius: 999,
          border: "none",
          background: "#fcd34d",
          color: "#0f172a",
          fontWeight: 700,
        }}
      >
        {loading ? "Running..." : "Run ClientIQ"}
      </button>
    </form>
  );
}
