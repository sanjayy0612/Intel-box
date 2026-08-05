/** /login -- a stub for the planned multi-user support, so the shell doesn't
 *  need rebuilding later. IntelBox is single-user and self-hosted today; this
 *  page says so rather than pretending to authenticate anyone. */

import React from "react";

import { Button, Notice, TextField } from "../components/ui";
import styles from "./Login.module.css";

export default function Login() {
  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <p className={`${styles.eyebrow} t-mono-label`}>IntelBox</p>
        <h1 className="t-h1">Sign in</h1>

        <Notice>
          Accounts aren't wired up yet. This instance is single-user — open the workspace
          directly.
        </Notice>

        <form
          className={styles.form}
          onSubmit={(event) => event.preventDefault()}
          aria-describedby="login-status"
        >
          <TextField label="Email" type="email" placeholder="you@example.com" />
          <TextField label="Password" type="password" placeholder="Your password" />
          <Button
            variant="primary"
            fullWidth
            disabled
            disabledReason="Multi-user support isn't built yet."
          >
            Sign in
          </Button>
        </form>

        <p id="login-status" className={`${styles.footnote} t-caption`}>
          Multi-user support isn't built yet.
        </p>

        <Button variant="ghost" to="/app">
          Open the workspace
        </Button>
      </div>
    </div>
  );
}
