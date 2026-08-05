/** Card, section header, empty state, notice. */

import React from "react";

import styles from "./Surface.module.css";

export function Card({ title, action, flush = false, className = "", children }) {
  return (
    <section className={`${styles.card} ${flush ? styles.cardFlush : ""} ${className}`}>
      {(title || action) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={`${styles.cardTitle} t-h3`}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, actions }) {
  return (
    <header className={styles.sectionHeader}>
      <div className={styles.sectionTitleGroup}>
        {eyebrow && <p className={`${styles.eyebrow} t-mono-label`}>{eyebrow}</p>}
        <h1 className="t-h1">{title}</h1>
      </div>
      {actions && <div className={styles.sectionActions}>{actions}</div>}
    </header>
  );
}

/** An h3 naming the space, one line explaining it, one primary button.
 *  Never "No data available", never "Nothing here yet". */
export function EmptyState({ title, body, action }) {
  return (
    <div className={styles.empty}>
      <h3 className="t-h3">{title}</h3>
      {body && <p className={`${styles.emptyBody} t-body-sm`}>{body}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

export function Notice({ tone = "neutral", children }) {
  return (
    <p
      className={`${styles.notice} ${tone === "error" ? styles.noticeError : ""} t-body-sm`}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
