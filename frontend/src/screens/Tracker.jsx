/** /tracker -- sent, opened, replied as a table with a follow-up column.
 *
 *  Deliberately not a kanban: this is a data-review task, and kanban would be
 *  decoration. The same table absorbs automated follow-up detection later.
 */

import React, { useState } from "react";

import { Button, EmptyState, Notice, SectionHeader, StatusPill, Table } from "../components/ui";
import { updateTracker } from "../api/client";
import { trackerEntries as fixtures } from "../fixtures/library";
import { relativeAge } from "../utils/time";

const COLUMNS = [
  { key: "person", label: "Person", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "channel", label: "Channel" },
  { key: "status", label: "Status" },
  { key: "sent", label: "Sent", sortable: true },
  { key: "followUp", label: "Follow-up" },
];

const NEXT_STATUS = { sent: "opened", opened: "replied", replied: "replied" };
const PILL_STATE = { sent: "queued", opened: "running", replied: "complete" };
const PILL_LABEL = { sent: "Sent", opened: "Opened", replied: "Replied" };

export default function Tracker() {
  const [entries, setEntries] = useState(fixtures);
  const [error, setError] = useState("");

  const advance = async (entry) => {
    const status = NEXT_STATUS[entry.status];
    const previous = entries;

    setError("");
    setEntries((current) =>
      current.map((row) => (row.id === entry.id ? { ...row, status } : row))
    );

    try {
      await updateTracker({ trackerId: entry.id, status, channel: entry.channel });
    } catch (caughtError) {
      // Put the row back rather than leaving the table showing something the
      // server never accepted.
      setEntries(previous);
      setError(caughtError.message || "Couldn't save that status. Try again.");
    }
  };

  const rows = entries.map((entry) => {
    const due = entry.followUpDue && Date.parse(entry.followUpDue) <= Date.now();
    return {
      id: entry.id,
      actionsPersistent: true,
      actions:
        entry.status === "replied" ? null : (
          <Button size="small" variant="ghost" onClick={() => advance(entry)}>
            Mark {NEXT_STATUS[entry.status]}
          </Button>
        ),
      cells: {
        person: entry.personName,
        company: entry.companyName,
        channel: entry.channel,
        status: <StatusPill state={PILL_STATE[entry.status]} label={PILL_LABEL[entry.status]} />,
        sent: relativeAge(entry.sentAt),
        followUp: due ? "Due now" : entry.followUpDue ? relativeAge(entry.followUpDue) : "—",
      },
    };
  });

  return (
    <>
      <SectionHeader eyebrow="Tracker" title="Outreach status" />
      {error && <Notice tone="error">{error}</Notice>}
      <Table
        columns={COLUMNS}
        rows={rows}
        emptyState={
          <EmptyState
            title="No outreach sent yet"
            body="Approve a draft and mark it sent, and it starts tracking here."
            action={
              <Button variant="primary" to="/outreach">
                View drafts
              </Button>
            }
          />
        }
      />
    </>
  );
}
