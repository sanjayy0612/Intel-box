/** /companies/:slug -- the persisted brief as a readable document.
 *  This is where Source Serif earns its place. */

import React, { useState } from "react";
import { useParams } from "react-router-dom";

import Report from "../components/Report/Report";
import {
  Button,
  Drawer,
  EmptyState,
  FreshnessDot,
  SectionHeader,
  Tabs,
} from "../components/ui";
import { companyDetail } from "../fixtures/library";
import styles from "./CompanyProfile.module.css";

export default function CompanyProfile() {
  const { slug } = useParams();
  const company = companyDetail[slug];
  const [tab, setTab] = useState("brief");
  // Person detail is a drawer, not a page: you're comparing people, not
  // navigating away from them.
  const [person, setPerson] = useState(null);

  if (!company) {
    return (
      <>
        <SectionHeader eyebrow="Company" title="Not in your library" />
        <EmptyState
          title="No profile for that company"
          body="Research it and its brief, competitors, and people are kept here."
          action={
            <Button variant="primary" to="/research/new">
              Run research
            </Button>
          }
        />
      </>
    );
  }

  const tabs = [
    { id: "brief", label: "Brief" },
    { id: "competitors", label: "Competitors", count: company.competitorList.length },
    { id: "people", label: "People", count: company.people.length },
  ];

  return (
    <>
      <SectionHeader
        eyebrow={company.category}
        title={company.name}
        actions={
          <>
            <FreshnessDot lastResearched={company.lastResearched} />
            <Button variant="secondary" to="/research/new">
              Re-run
            </Button>
          </>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} idPrefix="company">
        {tab === "brief" && <Report markdown={company.reportMarkdown} company={company.name} />}

        {tab === "competitors" && (
          <ul className={styles.list}>
            {company.competitorList.map((competitor) => (
              <li key={competitor.name} className={styles.listItem}>
                <span className="t-body">{competitor.name}</span>
                <span className={`${styles.muted} t-body-sm`}>{competitor.note}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === "people" && (
          <ul className={styles.list}>
            {company.people.map((entry) => (
              <li key={entry.id} className={styles.listItem}>
                <button
                  type="button"
                  className={styles.personButton}
                  onClick={() => setPerson(entry)}
                >
                  <span className="t-body">{entry.name}</span>
                  <span className={`${styles.muted} t-body-sm`}>{entry.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Tabs>

      <Drawer
        open={Boolean(person)}
        onClose={() => setPerson(null)}
        eyebrow={company.name}
        title={person?.name || ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPerson(null)}>
              Close
            </Button>
            <Button variant="primary" to="/outreach">
              Draft outreach
            </Button>
          </>
        }
      >
        {person && (
          <dl className={styles.detail}>
            <dt className="t-mono-label">Title</dt>
            <dd className="t-body">{person.title}</dd>
            <dt className="t-mono-label">Seniority</dt>
            <dd className="t-body">{person.seniority}</dd>
            <dt className="t-mono-label">Relevance</dt>
            <dd className="t-mono-data" data-numeric>
              {person.relevance.toFixed(2)}
            </dd>
            <dt className="t-mono-label">Why they surfaced</dt>
            <dd className="t-body-sm">{person.snippet}</dd>
          </dl>
        )}
      </Drawer>
    </>
  );
}
