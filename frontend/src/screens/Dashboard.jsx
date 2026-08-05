/** /app -- answers "what's happening": runs in flight, recent briefs, cache
 *  entries approaching 30 days, and follow-ups due. */

import React from "react";
import { Link } from "react-router-dom";

import { Button, Card, EmptyState, FreshnessDot, SectionHeader, StatusPill } from "../components/ui";
import { useActiveRun } from "../app/RunContext";
import { companies, followUpsDue, recentRuns } from "../fixtures/library";
import { freshnessState, relativeAge } from "../utils/time";
import styles from "./Dashboard.module.css";

const RUN_STATE = { completed: "complete", failed: "failed", running: "running", cached: "complete" };

export default function Dashboard() {
  const { run } = useActiveRun();
  const expiring = companies.filter((company) =>
    ["aging", "stale"].includes(freshnessState(company.lastResearched))
  );

  return (
    <>
      <SectionHeader
        eyebrow="Workspace"
        title="What's happening"
        actions={
          <Button variant="primary" to="/research/new">
            Run research
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card title="In flight">
          {run && !run.isTerminal ? (
            <Link to={`/runs/${run.runId}`} className={styles.rowLink}>
              <span className="t-body">{run.company}</span>
              <span className={`${styles.muted} t-body-sm`}>
                {run.totals.calls} of the agent's calls so far
              </span>
            </Link>
          ) : (
            <p className={`${styles.muted} t-body-sm`}>Nothing running.</p>
          )}
        </Card>

        <Card title="Follow-ups due">
          {followUpsDue.length ? (
            <ul className={styles.rows}>
              {followUpsDue.map((entry) => (
                <li key={entry.id} className={styles.row}>
                  <span className="t-body-sm">
                    {entry.personName} · {entry.companyName}
                  </span>
                  <span className={`${styles.muted} t-body-sm`}>
                    sent {relativeAge(entry.sentAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${styles.muted} t-body-sm`}>Nothing due.</p>
          )}
        </Card>

        <Card title="Recent briefs">
          <ul className={styles.rows}>
            {recentRuns.map((entry) => (
              <li key={entry.runId} className={styles.row}>
                <Link to={`/runs/${entry.runId}`} className={styles.inlineLink}>
                  {entry.company}
                </Link>
                <StatusPill state={RUN_STATE[entry.status] || "queued"} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Aging soon">
          {expiring.length ? (
            <ul className={styles.rows}>
              {expiring.map((company) => (
                <li key={company.slug} className={styles.row}>
                  <Link to={`/companies/${company.slug}`} className={styles.inlineLink}>
                    {company.name}
                  </Link>
                  <FreshnessDot lastResearched={company.lastResearched} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Everything is fresh"
              body="Profiles start aging at 21 days and expire at 30."
            />
          )}
        </Card>
      </div>
    </>
  );
}
