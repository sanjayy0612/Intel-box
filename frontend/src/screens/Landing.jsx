/** `/` -- most visitors arrive from GitHub and decide in ten seconds whether to
 *  clone. The hero is a real extraction log replaying, showing the agent choose
 *  web_search, then decide it needs competitor_search, then skip the scrape.
 *  Show the claim working rather than describing it.
 */

import React, { useEffect, useState } from "react";

import ExtractionLog from "../components/ExtractionLog/ExtractionLog";
import { Button } from "../components/ui";
import { normalizeRun } from "../api/adapters";
import { completedRun } from "../fixtures/runs";
import { useTheme } from "../theme/theme";
import styles from "./Landing.module.css";

const FULL_RUN = normalizeRun(completedRun);
const STEP_MS = 1400;
/** How long the finished log rests before the loop restarts. The last row is
 *  the skip -- the thing a visitor is here to notice -- so it holds longest. */
const HOLD_MS = 5000;

/** Replays the real log one row at a time. Never renders an empty panel: the
 *  hero's whole job is showing the claim working, and a visitor who lands
 *  mid-reset would see nothing. With motion off, the finished log shows
 *  immediately -- the page must be legible without the animation. */
function useReplay(reducedMotion) {
  const [visible, setVisible] = useState(reducedMotion ? FULL_RUN.calls.length : 1);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(FULL_RUN.calls.length);
      return undefined;
    }

    const complete = visible >= FULL_RUN.calls.length;
    const timer = window.setTimeout(
      () => setVisible(complete ? 1 : visible + 1),
      complete ? HOLD_MS : STEP_MS
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, visible]);

  const calls = FULL_RUN.calls.slice(0, visible).map((call, index) => ({
    ...call,
    state: index === visible - 1 && call.state === "complete" ? "running" : call.state,
  }));

  return {
    ...FULL_RUN,
    calls,
    isRunning: visible < FULL_RUN.calls.length,
    totals: {
      ...FULL_RUN.totals,
      calls: calls.filter((call) => call.state !== "skipped").length,
      skipped: calls.filter((call) => call.state === "skipped").length,
      durationMs: calls.reduce((sum, call) => sum + (call.durationMs || 0), 0) || null,
    },
  };
}

const SETUP = [
  "git clone https://github.com/your-org/intelbox.git",
  "cp .env.example .env",
  "docker compose -f deployment/docker-compose.yml up -d",
  "uvicorn api.main:app --reload",
];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = useReplay(reducedMotion);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <span className="t-h3">IntelBox</span>
        <div className={styles.topBarActions}>
          <Button variant="ghost" onClick={toggle}>
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </Button>
          <Button variant="secondary" to="/app">
            Open the workspace
          </Button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={`${styles.eyebrow} t-mono-label`}>Self-hosted market intelligence</p>
          <h1 className="t-display">The agent decides which research it needs.</h1>
          <p className={`${styles.lede} t-body`}>
            Give IntelBox a company and a category. It chooses its own tools one at a time,
            reacting to what each result turns up, and hands back a brief, a playbook, and the
            people worth contacting.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" to="/research/new">
              Run research
            </Button>
            <Button variant="secondary" href="https://github.com">
              Read the source
            </Button>
          </div>
        </div>

        <div className={styles.heroLog}>
          <ExtractionLog run={run} />
          <p className={`${styles.caption} t-caption`}>
            A real run. Note step 04: the agent declined to scrape, and said why.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="t-h2">What you get</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3 className="t-h3">An intelligence brief</h3>
            <p className={`${styles.muted} t-body-sm`}>
              Positioning, competitors, brand activity, and the watchouts, as a document you can
              read end to end.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className="t-h3">A campaign playbook</h3>
            <p className={`${styles.muted} t-body-sm`}>
              Concepts, audiences, and channels drawn from what the research actually found.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className="t-h3">The people to contact</h3>
            <p className={`${styles.muted} t-body-sm`}>
              Named decision-makers with drafted outreach, tracked from sent through replied.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="t-h2">It runs on your machine</h2>
        <p className={`${styles.muted} t-body`}>
          No accounts, no telemetry, MIT licensed. Bring your own model — Anthropic, OpenAI, or
          Groq — and your own SearXNG and MongoDB. Nothing leaves your infrastructure.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className="t-h2">Setup</h2>
        <ol className={styles.setup}>
          {SETUP.map((command) => (
            <li key={command} className="t-mono-data">
              {command}
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <p className={`${styles.muted} t-body-sm`}>MIT licensed. No accounts, no telemetry.</p>
      </footer>
    </div>
  );
}
