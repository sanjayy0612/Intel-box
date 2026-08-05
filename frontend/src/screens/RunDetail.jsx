/** /runs/:id -- the extraction log, then results settling in beneath it. */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ExtractionLog from "../components/ExtractionLog/ExtractionLog";
import Report from "../components/Report/Report";
import { Button, EmptyState, Notice, SectionHeader, StatusPill, Tabs } from "../components/ui";
import { useActiveRun } from "../app/RunContext";
import styles from "./RunDetail.module.css";

/** Company profiles are addressed by slug; runs only carry the display name. */
const slugify = (name) =>
  (name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const RUN_STATE = {
  queued: "queued",
  running: "running",
  completed: "complete",
  cached: "complete",
  failed: "failed",
};

/** An action keeps its name through the flow: `Run research` produces
 *  "Researching", and a result that says "Research complete." */
const RUN_LABEL = {
  queued: "Queued",
  running: "Researching",
  completed: "Research complete",
  cached: "Served from cache",
  failed: "Research failed",
};

export default function RunDetail() {
  const { id } = useParams();
  const { run, error, resumeRun } = useActiveRun();
  const [tab, setTab] = useState("brief");

  useEffect(() => {
    if (!id) return;
    if (run?.runId === id) return;
    resumeRun(id);
  }, [id, run?.runId, resumeRun]);

  if (error && !run) {
    return (
      <>
        <SectionHeader eyebrow="Run" title="Run detail" />
        <Notice tone="error">{error}</Notice>
      </>
    );
  }

  if (!run) {
    return (
      <>
        <SectionHeader eyebrow="Run" title="Run detail" />
        <EmptyState
          title="The agent hasn't chosen its tools yet"
          body="Start a run and its tool calls appear here as they happen."
          action={
            <Button variant="primary" to="/research/new">
              Start run
            </Button>
          }
        />
      </>
    );
  }

  // The run payload carries the brief and nothing else: the orchestrator persists
  // competitors, decision-makers, and drafts but doesn't return them. Until it
  // does, these tabs say so rather than borrowing another company's data.
  const tabs = [
    { id: "brief", label: "Brief" },
    { id: "competitors", label: "Competitors" },
    { id: "people", label: "People" },
    { id: "drafts", label: "Drafts" },
  ];

  const companyLink = (
    <Button variant="secondary" to={`/companies/${slugify(run.company)}`}>
      Open company profile
    </Button>
  );

  return (
    <>
      <SectionHeader
        eyebrow={`Run · ${run.runId}`}
        title={run.company}
        actions={
          <>
            <StatusPill state={RUN_STATE[run.status] || "queued"} label={RUN_LABEL[run.status]} />
            {run.isTerminal && (
              <Button variant="secondary" to="/research/new">
                Run again
              </Button>
            )}
          </>
        }
      />

      <p className={`${styles.subject} t-body-sm`}>{run.category}</p>

      <div className={styles.log}>
        <ExtractionLog run={run} />
      </div>

      {error && (
        <div className={styles.notice}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {run.isTerminal ? (
        <Tabs tabs={tabs} value={tab} onChange={setTab} idPrefix="run">
          {tab === "brief" && <Report markdown={run.reportMarkdown} company={run.company} />}

          {tab === "competitors" && (
            <EmptyState
              title="Competitors are saved, not returned"
              body="The agent mapped them and wrote them to storage, but the run response doesn't carry them yet. They're on the company profile."
              action={companyLink}
            />
          )}

          {tab === "people" && (
            <EmptyState
              title="People are saved, not returned"
              body="Decision-makers found during this run were persisted, but the run response doesn't carry them yet. They're on the company profile."
              action={companyLink}
            />
          )}

          {tab === "drafts" && (
            <EmptyState
              title="No drafts in this response"
              body="Outreach drafts were written to storage during this run. The queue shows everything drafted so far."
              action={
                <Button variant="secondary" to="/outreach">
                  View drafts
                </Button>
              }
            />
          )}
        </Tabs>
      ) : (
        <p className={`${styles.pending} t-body-sm`}>
          Results appear here once the run finishes.
        </p>
      )}
    </>
  );
}
