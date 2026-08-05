/** /research/new -- company, category, and the scope controls the form lacks.
 *
 *  Each control states its consequence in plain language rather than hiding it.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, ChoiceField, Notice, SectionHeader, TextField, ToggleField } from "../components/ui";
import { useActiveRun } from "../app/RunContext";
import styles from "./NewResearch.module.css";

const DEPTHS = [
  { value: "quick", label: "Quick", consequence: "Usually one web search. Fastest, thinnest." },
  { value: "standard", label: "Standard", consequence: "The agent picks what the company needs." },
  { value: "deep", label: "Deep", consequence: "Encourages competitor mapping and page reads." },
];

export default function NewResearch() {
  const navigate = useNavigate();
  const { startRun, error } = useActiveRun();

  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("");
  const [depth, setDepth] = useState("standard");
  const [findPeople, setFindPeople] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [touched, setTouched] = useState(false);

  const missing = !company.trim() || !category.trim();
  const depthConsequence = DEPTHS.find((option) => option.value === depth)?.consequence;

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (missing) return;

    const record = await startRun({
      company: company.trim(),
      category: category.trim(),
      depth,
      find_people: findPeople,
      force_refresh: forceRefresh,
    });
    if (record?.runId) navigate(`/runs/${record.runId}`);
  };

  return (
    <>
      <SectionHeader eyebrow="Research" title="New research" />

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.pair}>
          <TextField
            label="Company"
            placeholder="Zepto"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            error={touched && !company.trim() ? "Name the company you want researched." : null}
          />
          <TextField
            label="Category"
            placeholder="quick commerce"
            helper="How the company competes, in the words you'd use yourself."
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            error={touched && !category.trim() ? "Name the category it competes in." : null}
          />
        </div>

        <ChoiceField
          label="Research depth"
          name="depth"
          options={DEPTHS}
          value={depth}
          onChange={setDepth}
          helper={depthConsequence}
        />

        <ToggleField
          label="Look for decision-makers"
          helper="Adds a people search and produces outreach drafts."
          checked={findPeople}
          onChange={setFindPeople}
        />

        <ToggleField
          label="Ignore the cached profile"
          helper="This will re-run every tool the agent chooses, even if this company was researched in the last 30 days."
          checked={forceRefresh}
          onChange={setForceRefresh}
        />

        {error && <Notice tone="error">{error}</Notice>}

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            Run research
          </Button>
        </div>
      </form>
    </>
  );
}
