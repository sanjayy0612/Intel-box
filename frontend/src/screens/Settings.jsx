/** /settings -- provider, search, storage, cache.
 *
 *  `agent/llm/` auto-detects the provider from whichever key is set, and which
 *  one actually resolved is currently invisible. That indicator is the point of
 *  this page. `google-genai` is never rendered as configurable: it's an unused
 *  dependency, and showing it would imply a code path that doesn't exist.
 */

import React, { useState } from "react";

import { Button, Card, SectionHeader, StatusPill, Tabs, TextField } from "../components/ui";
import { CACHE_TTL_DAYS } from "../utils/time";
import styles from "./Settings.module.css";

const TABS = [
  { id: "provider", label: "Provider" },
  { id: "search", label: "Search" },
  { id: "storage", label: "Storage" },
  { id: "cache", label: "Cache" },
];

/** Resolution order matches agent/llm/__init__.py: an explicit LLM_PROVIDER
 *  wins, otherwise the first provider with a key present. */
const PROVIDERS = [
  { id: "anthropic", label: "Anthropic", env: "ANTHROPIC_API_KEY", present: true },
  { id: "openai", label: "OpenAI", env: "OPENAI_API_KEY", present: false },
  { id: "groq", label: "Groq", env: "GROQ_API_KEY", present: false },
];

function DefinitionRow({ label, children }) {
  return (
    <div className={styles.row}>
      <span className={`${styles.rowLabel} t-mono-label`}>{label}</span>
      <span className="t-body-sm">{children}</span>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("provider");
  const [searxng, setSearxng] = useState("http://localhost:8080");
  const [ttl, setTtl] = useState(String(CACHE_TTL_DAYS));

  const resolved = PROVIDERS.find((provider) => provider.present);

  return (
    <>
      <SectionHeader eyebrow="Settings" title="Configuration" />

      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="settings">
        {tab === "provider" && (
          <Card
            title="Language model"
            action={
              <StatusPill
                state={resolved ? "complete" : "failed"}
                label={resolved ? `Using ${resolved.label}` : "No provider"}
              />
            }
          >
            <p className={`${styles.explainer} t-body-sm`}>
              IntelBox uses the first provider with a key set, unless you name one explicitly.
              Without a provider it runs every tool on every request instead of choosing.
            </p>
            <div className={styles.rows}>
              {PROVIDERS.map((provider) => (
                <DefinitionRow key={provider.id} label={provider.label}>
                  {provider.present ? `${provider.env} is set` : `${provider.env} is not set`}
                </DefinitionRow>
              ))}
            </div>
          </Card>
        )}

        {tab === "search" && (
          <Card
            title="SearXNG"
            action={<Button size="small" variant="secondary">Check connection</Button>}
          >
            <div className={styles.field}>
              <TextField
                label="SearXNG URL"
                placeholder="http://localhost:8080"
                helper="The search backend every research tool goes through."
                value={searxng}
                onChange={(event) => setSearxng(event.target.value)}
              />
            </div>
          </Card>
        )}

        {tab === "storage" && (
          <Card
            title="MongoDB via MCP"
            action={<StatusPill state="complete" label="Connected" />}
          >
            <div className={styles.rows}>
              <DefinitionRow label="Database">intelbox</DefinitionRow>
              <DefinitionRow label="Transport">MCP, JSON-RPC</DefinitionRow>
              <DefinitionRow label="Collections">7</DefinitionRow>
            </div>
          </Card>
        )}

        {tab === "cache" && (
          <Card title="Cache">
            <p className={`${styles.explainer} t-body-sm`}>
              A company researched inside this window is served from storage instead of being
              researched again. Profiles start showing as aging at 21 days.
            </p>
            <div className={styles.field}>
              <TextField
                label="Cache TTL in days"
                inputMode="numeric"
                placeholder="30"
                value={ttl}
                onChange={(event) => setTtl(event.target.value)}
              />
            </div>
          </Card>
        )}
      </Tabs>
    </>
  );
}
