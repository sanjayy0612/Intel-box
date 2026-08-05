/** The intelligence brief, rendered as a document.
 *
 *  Export is an action, not a destination -- there is no export route.
 */

import React from "react";
import ReactMarkdown from "react-markdown";

import Button from "../ui/Button";
import { EmptyState } from "../ui/Surface";
import styles from "./Report.module.css";

function downloadMarkdown(markdown, company) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(company || "intelbox-brief").toLowerCase().replace(/\s+/g, "-")}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Report({ markdown, company, emptyTitle, emptyBody, emptyAction }) {
  if (!markdown) {
    return (
      <EmptyState
        title={emptyTitle || "No brief yet"}
        body={emptyBody || "The brief appears here once the agent finishes synthesising."}
        action={emptyAction}
      />
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <p className={`${styles.toolbarLabel} t-mono-label`}>Intelligence brief</p>
        <Button size="small" variant="ghost" onClick={() => downloadMarkdown(markdown, company)}>
          Download markdown
        </Button>
      </div>
      <article className={styles.report}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
