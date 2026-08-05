/** Right-side drawer. ESC and overlay-click dismiss, focus is trapped while
 *  open and restored to the trigger on close. */

import React, { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./Drawer.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Drawer({ open, onClose, eyebrow, title, footer, children }) {
  const drawerRef = useRef(null);
  const restoreRef = useRef(null);
  const titleId = useId();

  const focusableNodes = useCallback(
    () => Array.from(drawerRef.current?.querySelectorAll(FOCUSABLE) || []),
    []
  );

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    focusableNodes()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = focusableNodes();
      if (!nodes.length) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      // Focus goes back where it came from, so the list doesn't lose its place.
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus();
    };
  }, [open, onClose, focusableNodes]);

  if (!open) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {eyebrow && <p className={`${styles.eyebrow} t-mono-label`}>{eyebrow}</p>}
            <h2 id={titleId} className="t-h3">
              {title}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>,
    document.body
  );
}
