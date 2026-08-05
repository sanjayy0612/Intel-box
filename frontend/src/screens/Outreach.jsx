/** /outreach -- draft queue grouped by company. Edit, approve, mark sent.
 *  Person detail in a drawer, because you're comparing drafts rather than
 *  navigating away from them. */

import React, { useMemo, useState } from "react";

import { Button, Card, Drawer, EmptyState, SectionHeader, StatusPill, TextField } from "../components/ui";
import { drafts as draftFixtures } from "../fixtures/library";
import styles from "./Outreach.module.css";

const DRAFT_STATE = { drafted: "queued", sent: "complete", replied: "complete" };

export default function Outreach() {
  const [drafts, setDrafts] = useState(draftFixtures);
  const [editing, setEditing] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const grouped = useMemo(() => {
    const map = new Map();
    for (const draft of drafts) {
      if (!map.has(draft.companyName)) map.set(draft.companyName, []);
      map.get(draft.companyName).push(draft);
    }
    return [...map.entries()];
  }, [drafts]);

  const openEditor = (draft) => {
    setEditing(draft);
    setSubject(draft.subject);
    setBody(draft.body);
  };

  const saveDraft = () => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === editing.id ? { ...draft, subject, body } : draft))
    );
    setEditing(null);
  };

  const markSent = (id) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, status: "sent" } : draft))
    );
  };

  if (!drafts.length) {
    return (
      <>
        <SectionHeader eyebrow="Outreach" title="Your drafts" />
        <EmptyState
          title="No outreach drafted yet"
          body="Research a company with decision-maker discovery on, and drafts land here."
          action={
            <Button variant="primary" to="/research/new">
              Run research
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <SectionHeader eyebrow="Outreach" title="Your drafts" />

      <div className={styles.groups}>
        {grouped.map(([companyName, companyDrafts]) => (
          <section key={companyName}>
            <h2 className={`${styles.groupTitle} t-h3`}>{companyName}</h2>
            <div className={styles.cards}>
              {companyDrafts.map((draft) => (
                <Card key={draft.id}>
                  <div className={styles.cardHead}>
                    <div>
                      <p className="t-body">{draft.personName}</p>
                      <p className={`${styles.muted} t-body-sm`}>{draft.personTitle}</p>
                    </div>
                    <StatusPill
                      state={DRAFT_STATE[draft.status] || "queued"}
                      label={draft.status === "sent" ? "Sent" : "Drafted"}
                    />
                  </div>

                  {draft.subject && <p className={`${styles.subject} t-body-sm`}>{draft.subject}</p>}
                  <p className={`${styles.body} t-body-sm`}>{draft.body}</p>

                  <div className={styles.actions}>
                    <Button size="small" variant="ghost" onClick={() => openEditor(draft)}>
                      Edit draft
                    </Button>
                    {draft.status !== "sent" && (
                      <Button size="small" variant="ghost" onClick={() => markSent(draft.id)}>
                        Mark sent
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        eyebrow={editing?.companyName}
        title={`Draft for ${editing?.personName || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Discard changes
            </Button>
            <Button variant="primary" onClick={saveDraft}>
              Save changes
            </Button>
          </>
        }
      >
        <div className={styles.editor}>
          {editing?.channel === "email" && (
            <TextField
              label="Subject"
              placeholder="Dark-store density, not discounting"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          )}
          <TextField
            label="Message"
            multiline
            rows={12}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
      </Drawer>
    </>
  );
}
